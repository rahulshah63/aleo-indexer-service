// aleo-indexer/src/cli/generate.ts

import fs from 'fs/promises';
import path from 'path';
import { IndexerConfig, AleoValueType, AleoPrimitiveType } from '../utils/types.js';

// --- Type Mappings ---

// A mapping from Aleo primitive types to Drizzle PG types
const aleoPrimitiveToDrizzlePg: { [key in AleoPrimitiveType]: string } = {
  address: `varchar("{{name}}", { length: 63 })`, // Aleo addresses are 63 chars long
  field: `varchar("{{name}}", { length: 255 })`,  // Fields can be large numbers, store as string
  u8: `smallint("{{name}}")`, // Use smallint for u8
  u16: `integer("{{name}}")`,
  u32: `integer("{{name}}")`,
  u64: `bigint("{{name}}", { mode: "number" })`, // Use number mode, BigInt in JS
  u128: `bigint("{{name}}", { mode: "number" })`, // Use number mode, BigInt in JS
  boolean: `boolean("{{name}}")`,
};

// A mapping from Aleo primitive types to GraphQL types
const aleoPrimitiveToGraphQL: { [key in AleoPrimitiveType]: string } = {
    address: 'String',
    field: 'String',
    u8: 'Int',
    u16: 'Int',
    u32: 'Int',
    u64: 'BigInt', // Use custom scalar for BigInt
    u128: 'BigInt', // Use custom scalar for BigInt
    boolean: 'Boolean',
};

/**
 * Gets the appropriate Drizzle PG type string based on the AleoValueType.
 * Handles primitives, records, arrays, and structs by mapping them to `jsonb` or specific types.
 * @param typeConfig The AleoValueType configuration.
 * @param name The column name (for `{{name}}` placeholder).
 * @returns The Drizzle PG type string.
 */
function getDrizzleType(typeConfig: AleoValueType, name: string): string {
    if (typeConfig.kind === 'primitive') {
        return aleoPrimitiveToDrizzlePg[typeConfig.type].replace('{{name}}', name);
    } else if (typeConfig.kind === 'record' || typeConfig.kind === 'array' || typeConfig.kind === 'struct') {
        // For complex types (records, arrays, structs), store as JSONB
        return `jsonb("${name}")`;
    }
    throw new Error(`Unsupported Aleo type kind for Drizzle: ${typeConfig}`);
}

/**
 * Gets the appropriate GraphQL type string based on the AleoValueType.
 * Handles primitives, records, arrays, and structs.
 * @param typeConfig The AleoValueType configuration.
 * @returns The GraphQL type string.
 */
function getGraphQLType(typeConfig: AleoValueType): string {
    if (typeConfig.kind === 'primitive') {
        return aleoPrimitiveToGraphQL[typeConfig.type];
    } else if (typeConfig.kind === 'record' || typeConfig.kind === 'array') {
        // For Aleo records and arrays (as they appear in Aleo transactions), use JSON scalar
        return 'JSON'; // Assumes a `scalar JSON` definition in GraphQL schema
    } else if (typeConfig.kind === 'struct') {
        // For custom structs like UserData, use their generated GraphQL type name
        return typeConfig.structName;
    }
    throw new Error(`Unsupported Aleo type kind for GraphQL: ${typeConfig}`);
}

/**
 * Generates both Drizzle and GraphQL schemas based on the provided IndexerConfig.
 * @param config The IndexerConfig.
 */
export async function generateSchemas(config: IndexerConfig) {
  await generateDrizzleSchema(config);
  await generateGraphQLSchema(config);
}

/**
 * Generates the Drizzle ORM schema file (`schema.ts`).
 * @param config The IndexerConfig.
 */
async function generateDrizzleSchema(config: IndexerConfig) {
  let schemaContent = `
import { pgTable, serial, text, varchar, timestamp, jsonb, integer, bigint, boolean, smallint } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm'; // Import relations for defining relationships

// --- Base Indexer Tables (Always Included) ---

// Table to track the indexing progress for each program
export const indexerState = pgTable("indexer_state", {
  programName: varchar("program_name", { length: 255 }).primaryKey(),
  lastIndexedBlock: integer("last_indexed_block").default(0).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

// Table to store raw Aleo transaction details that are indexed
export const transactions = pgTable("transactions", {
  id: varchar("id", { length: 255 }).primaryKey(), // Aleo transaction_id
  programId: text("program_id").notNull(),       // The Aleo program ID
  functionName: text("function_name").notNull(), // The Aleo function name
  blockHeight: integer("block_height").notNull(),
  timestamp: timestamp("timestamp").notNull(),   // Transaction finalized timestamp
  raw: jsonb("raw"),                             // Store the raw transaction object as JSONB
});

// Define relations for the base transactions table (if any future tables link to it)
export const transactionsRelations = relations(transactions, ({ many }) => ({
  // Link to function-specific event tables
  // Example: depositTokenEvents: many(depositTokenEvents),
}));

// --- Auto-Generated Tables from indexer.config.ts ---

`;

  // Collect all generated table names to create relations later
  const generatedTableNames: string[] = [];

  // Generate tables for functions
  for (const program of config.programs) {
    if (program.functions) {
      for (const func of program.functions) {
        generatedTableNames.push(func.tableName);
        schemaContent += `export const ${func.tableName} = pgTable("${func.tableName}", {\n`;
        schemaContent += `  id: serial("id").primaryKey(),\n`; // Auto-incrementing primary key for event rows
        schemaContent += `  transactionId: varchar("transaction_id", { length: 255 }).notNull(),\n`; // Link to raw transaction

        // Add columns for each input defined in the function config
        for (const input of func.inputs) {
          const drizzleType = getDrizzleType(input.aleoType, input.name);
          schemaContent += `  ${input.name}: ${drizzleType},\n`;
        }

        // Add columns from 'extract' mapping
        for (const dbColumnName in func.extract) {
            const rpcPath = func.extract[dbColumnName];
            // Infer type. This is simplified. In a real scenario, you might want to specify type in extract config.
            // For now, assume a common string/text type for extracted raw values.
            schemaContent += `  ${dbColumnName}: text("${dbColumnName}"),\n`;
        }

        schemaContent += `});\n\n`;

        // Define relations for function-specific tables
        schemaContent += `export const ${func.tableName}Relations = relations(${func.tableName}, ({ one }) => ({\n`;
        schemaContent += `  transaction: one(transactions, {\n`;
        schemaContent += `    fields: [${func.tableName}.transactionId],\n`;
        schemaContent += `    references: [transactions.id],\n`;
        schemaContent += `  }),\n`;
        schemaContent += `}));\n\n`;
      }
    }

    // Generate tables for mappings
    if (program.mappings) {
        for (const mapping of program.mappings) {
            generatedTableNames.push(mapping.tableName);
            schemaContent += `export const ${mapping.tableName} = pgTable("${mapping.tableName}", {\n`;
            
            // Key column for the mapping, which is also the primary key
            const keyDrizzleType = getDrizzleType(mapping.key.aleoType, 'key');
            schemaContent += `  key: ${keyDrizzleType}.primaryKey(),\n`;
            
            // Value column for the mapping. Store as JSONB if complex, otherwise use specific type.
            const valueDrizzleType = getDrizzleType(mapping.value, 'value');
            schemaContent += `  value: ${valueDrizzleType}.notNull(),\n`;
            
            schemaContent += `  lastUpdatedBlock: integer("last_updated_block").notNull(),\n`; // Last block at which this mapping was updated
            schemaContent += `});\n\n`;
            
            // Mapping tables generally don't have relations to transactions in the same way,
            // as they store the latest state, not event data.
        }
    }
  }

  // Create relations.ts (can be a separate file or included here for simplicity)
  // For simplicity, we can include relations directly in schema.ts for small projects.
  // For large schemas, a separate `relations.ts` file is cleaner.
  // The user asked for a separate `relations.ts`, so let's aim for that.
  let relationsContent = `
import { relations } from 'drizzle-orm';
import { transactions, ${generatedTableNames.join(', ')} } from './schema';

// This file defines the relations between your Drizzle tables.
// It is auto-generated based on your indexer.config.ts.

`;
  // Add relations content if generated tables link to each other or to base tables.
  // This depends on the specific relations defined in `schemaContent` above.
  // For now, only basic relation between function events and transactions is created.

  const drizzleOutputPath = path.join(process.cwd(), 'drizzle', 'generated', 'schema.ts');
  const relationsOutputPath = path.join(process.cwd(), 'drizzle', 'generated', 'relations.ts');

  await fs.mkdir(path.dirname(drizzleOutputPath), { recursive: true });
  await fs.writeFile(drizzleOutputPath, schemaContent);
  await fs.writeFile(relationsOutputPath, relationsContent); // Write empty relations.ts for now, or populate more if needed.
  
  console.log(`✅ Drizzle schema generated at ${drizzleOutputPath}`);
  console.log(`✅ Drizzle relations generated at ${relationsOutputPath}`);
}


/**
 * Generates the GraphQL schema file (`schema.graphql`).
 * @param config The IndexerConfig.
 */
async function generateGraphQLSchema(config: IndexerConfig) {
    let schemaContent = `
# --- Base Types ---
scalar BigInt  # Represents u64 and u128 Aleo types
scalar DateTime # Represents timestamps
scalar JSON    # Represents complex Aleo records, arrays, or generic JSON data

type Query {
    transactions(
        limit: Int = 10,
        offset: Int = 0,
        programId: String,
        functionName: String
    ): [Transaction!]
    transaction(id: String!): Transaction
`;

    const generatedGraphQLTypes: Set<string> = new Set(); // To keep track of defined types and avoid duplicates

    // Add top-level queries for each generated table (functions and mappings)
    for (const program of config.programs) {
        if (program.functions) {
            for (const func of program.functions) {
                const typeName = func.tableName.charAt(0).toUpperCase() + func.tableName.slice(1);
                generatedGraphQLTypes.add(typeName);
                schemaContent += `    ${func.tableName}(limit: Int = 10, offset: Int = 0): [${typeName}!]\n`;

                // ADD THIS SECTION: Generate singular query for function-based tables
                const singularFunctionName = func.tableName.endsWith('s') && func.tableName.length > 1
                    ? func.tableName.slice(0, -1)
                    : func.tableName;
                // Assuming 'id' is always Int! for function-derived tables based on your Drizzle schema serial('id')
                schemaContent += `    ${singularFunctionName}(id: Int!): ${typeName}\n`;
            }
        }
        if (program.mappings) {
            for (const mapping of program.mappings) {
                const typeName = mapping.tableName.charAt(0).toUpperCase() + mapping.tableName.slice(1);
                generatedGraphQLTypes.add(typeName);
                schemaContent += `    ${mapping.tableName}(limit: Int = 10, offset: Int = 0): [${typeName}!]\n`;
                // Add a singular query for fetching a mapping by its key
                const singularMappingName = mapping.tableName.endsWith('s') ? mapping.tableName.slice(0, -1) : mapping.tableName;
                if (singularMappingName !== mapping.tableName) { // Only if it's a plural mapping table
                    // Determine key type dynamically for mappings
                    const keyGraphQLType = getGraphQLType(mapping.key.aleoType);
                    schemaContent += `    ${singularMappingName}(key: ${keyGraphQLType}!): ${typeName}\n`; // Key should be its Aleo type
                }
            }
        }
    }
    schemaContent += `}\n\n`;


    schemaContent += `
# --- Base Schemas (Always Included) ---

type IndexerState {
    programName: String!
    lastIndexedBlock: Int!
    lastUpdated: DateTime!
}

type Transaction {
    id: String!
    programId: String!
    functionName: String!
    blockHeight: Int!
    timestamp: DateTime!
    raw: JSON # Store the raw transaction object
}\n\n`;

    schemaContent += `# --- Auto-Generated Schemas from indexer.config.ts ---\n\n`;

    // Generate custom GraphQL types for structs (like UserData)
    for (const program of config.programs) {
        if (program.mappings) {
            for (const mapping of program.mappings) {
                if (mapping.value.kind === 'struct') {
                    if (!generatedGraphQLTypes.has(mapping.value.structName)) { // Avoid duplicate type definitions
                        generatedGraphQLTypes.add(mapping.value.structName);
                        schemaContent += `type ${mapping.value.structName} {\n`;
                        for (const fieldName in mapping.value.fields) {
                            const fieldType = getGraphQLType(mapping.value.fields[fieldName]);
                            schemaContent += `  ${fieldName}: ${fieldType}\n`;
                        }
                        schemaContent += `}\n\n`;
                    }
                }
            }
        }
    }


    // Generate types for functions (event data)
    for (const program of config.programs) {
        if (program.functions) {
            for (const func of program.functions) {
                const typeName = func.tableName.charAt(0).toUpperCase() + func.tableName.slice(1);
                if (!generatedGraphQLTypes.has(typeName)) { // Should already be added by queries, but good to check
                    generatedGraphQLTypes.add(typeName);
                }
                schemaContent += `type ${typeName} {\n`;
                schemaContent += `  id: Int!\n`;
                schemaContent += `  transaction: Transaction!\n`; // Reference to the base transaction
                 for (const input of func.inputs) {
                    const graphQLType = getGraphQLType(input.aleoType);
                    schemaContent += `  ${input.name}: ${graphQLType}\n`;
                }
                // Add fields from 'extract'
                for (const dbColumnName in func.extract) {
                    schemaContent += `  ${dbColumnName}: String\n`; // Assume string for extracted raw values
                }
                schemaContent += `}\n\n`;
            }
        }
    }
    
    // Generate types for mappings
    for (const program of config.programs) {
        if (program.mappings) {
            for (const mapping of program.mappings) {
                const typeName = mapping.tableName.charAt(0).toUpperCase() + mapping.tableName.slice(1);
                if (!generatedGraphQLTypes.has(typeName)) { // Should already be added by queries
                    generatedGraphQLTypes.add(typeName);
                }
                schemaContent += `type ${typeName} {\n`;
                const keyGraphQLType = getGraphQLType(mapping.key.aleoType);
                schemaContent += `  key: ${keyGraphQLType}!\n`;
                const valueGraphQLType = getGraphQLType(mapping.value);
                schemaContent += `  value: ${valueGraphQLType}!\n`; // Can be JSON or a specific struct type
                schemaContent += `  lastUpdatedBlock: Int!\n`;
                schemaContent += `}\n\n`;
            }
        }
    }


    const outputPath = path.join(process.cwd(), 'schema.graphql'); // Output directly in the example directory
    await fs.writeFile(outputPath, schemaContent);
    console.log(`✅ GraphQL schema generated at ${outputPath}`);
}