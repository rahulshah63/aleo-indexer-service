// aleo-indexer/src/server/index.ts

import { Hono } from 'hono';
import { createYoga } from 'graphql-yoga';
import { createSchema } from 'graphql-yoga';
import { readFileSync } from 'node:fs';
import { asc, desc, eq, and, ne, gt, gte, lt, lte, inArray, SQL } from 'drizzle-orm';
import { PgColumn } from 'drizzle-orm/pg-core';
import { logger } from '../utils/logger.js';
import { DbInstance, GeneratedSchema } from '../utils/types.js';
import GraphQLJSON from 'graphql-type-json';
import { GraphQLBigInt, GraphQLDateTime } from 'graphql-scalars';

// Global variables to hold the dynamically loaded DB and schema
let dbInstance: DbInstance | null = null;
let generatedSchema: GeneratedSchema | null = null;

// Define the operators your API will support, mapping them to Drizzle functions
const operatorMap = {
  _eq: eq,
  _neq: ne,
  _gt: gt,
  _gte: gte,
  _lt: lt,
  _lte: lte,
  _in: inArray,
};

type DrizzleOperator = keyof typeof operatorMap;

/**
 * Builds an array of Drizzle filter conditions from a GraphQL 'where' object.
 * @param table - The Drizzle table schema object.
 * @param where - The 'where' object from the GraphQL query arguments.
 * @returns An array of Drizzle SQL conditions.
 */
function buildWhereClause(
  table: Record<string, PgColumn>,
  where: Record<string, Record<string, any>>
): SQL[] {
  const conditions: SQL[] = [];

  for (const columnName in where) {
    if (Object.prototype.hasOwnProperty.call(table, columnName)) {
      const column = table[columnName];
      const operatorsObject = where[columnName];

      if (typeof operatorsObject !== 'object' || operatorsObject === null) {
        continue;
      }

      for (const operatorKey in operatorsObject) {
        if (Object.prototype.hasOwnProperty.call(operatorMap, operatorKey)) {
          const operatorFn = operatorMap[operatorKey as DrizzleOperator];
          const value = operatorsObject[operatorKey];
          if (operatorKey === '_in') {
            // inArray expects the value to be an array
            if (Array.isArray(value)) {
              conditions.push((operatorFn as typeof inArray)(column, value));
            } else {
              logger.warn(`Operator '_in' expects an array value for column: ${columnName}`);
            }
          } else {
            // Other operators expect a single value
            conditions.push((operatorFn as (col: PgColumn, val: any) => SQL)(column, value));
          }
        } else {
          logger.warn(`Unsupported filter operator: ${operatorKey}`);
        }
      }
    }
  }
  return conditions;
}

/**
 * Initializes the GraphQL server with the provided DB connection, generated schema, and GraphQL schema path.
 * This function will be called by the `aleo-indexer start` command.
 * @param db The Drizzle DB instance.
 * @param schema The dynamically loaded Drizzle schema tables.
 * @param gqlSchemaPath The path to the generated GraphQL schema file.
 * @returns The Hono application instance.
 */
export async function initializeGraphQLServer(db: DbInstance, schema: GeneratedSchema, gqlSchemaPath: string) {
  dbInstance = db;
  generatedSchema = schema;

  const app = new Hono();

  // Load the generated GraphQL schema
  const typeDefs = readFileSync(gqlSchemaPath, 'utf-8');

  // Dynamically create resolvers based on the generated schema
  const resolvers = {
    Query: {
      transactions: async (_: any, {
        limit = 10,
        offset = 0,
        programId,
        functionName,
        where,
        orderBy = 'blockHeight',
        orderDirection = 'desc',
      }: {
        limit?: number;
        offset?: number;
        programId?: string;
        functionName?: string;
        where?: Record<string, Record<string, any>>; // <-- ADDED where type
        orderBy?: 'blockHeight' | 'timestamp' | 'programId' | 'functionName';
        orderDirection?: 'asc' | 'desc';
      }
      ) => {
        if (!generatedSchema || !dbInstance) throw new Error('Database or schema not initialized.');

        let query = dbInstance.select().from(generatedSchema.transactions);
        const filterConditions: SQL[] = [];

        // --- REFACTORED FILTERING LOGIC ---

        // Handle dedicated filters first
        if (programId) {
          filterConditions.push(eq(generatedSchema.transactions.programId, programId));
        }
        if (functionName) {
          filterConditions.push(eq(generatedSchema.transactions.functionName, functionName));
        }

        // Handle generic 'where' clause for dynamic filtering
        if (where) {
          const dynamicConditions = buildWhereClause(generatedSchema.transactions, where);
          filterConditions.push(...dynamicConditions);
        }

        // Apply all collected filters if any exist
        if (filterConditions.length > 0) {
          query = query.where(and(...filterConditions));
        }

        // Apply ordering
        const orderColumn = generatedSchema.transactions[orderBy];
        query = orderDirection === 'asc'
          ? query.orderBy(asc(orderColumn))
          : query.orderBy(desc(orderColumn));

        // Apply pagination
        query = query.limit(limit).offset(offset);

        return await query;
      },
      transaction: async (_: any, { id }: { id: string }) => {
        if (!generatedSchema || !dbInstance) throw new Error('Database or schema not initialized.');
        const result = await dbInstance.select().from(generatedSchema.transactions).where(eq(generatedSchema.transactions.id, id));
        return result[0];
      },
      // Dynamically add resolvers for other generated tables (functions and mappings)
      ...createDynamicResolvers(generatedSchema),
    },
    // Add resolvers for custom scalars
    BigInt: GraphQLBigInt,
    DateTime: GraphQLDateTime,
    JSON: GraphQLJSON,
  };
  logger.info(`Generated GraphQL Resolvers: ${Object.keys(resolvers.Query).map(key => key).join(', ')}...`);

  const yoga = createYoga({
    schema: createSchema({
      typeDefs,
      resolvers,
    }),
    graphiql: true,
  });
  //@ts-expect-error
  app.use('/graphql', (c) => yoga({ request: c.req.raw }));

  return app;
}

/**
 * Creates dynamic GraphQL resolvers for auto-generated tables.
 * @param schema The generated Drizzle schema.
 * @returns An object mapping table names to their respective resolver functions.
 */
function createDynamicResolvers(schema: GeneratedSchema) {
  const dynamicResolvers: Record<string, Function> = {};

  for (const tableName in schema) {
    if (tableName === 'transactions' || tableName === 'indexerState') {
      continue;
    }

    const table = schema[tableName];
    if (typeof table === 'object' && table !== null && 'getSQL' in table) {
      // Resolver for fetching many records with ordering and filtering support
      dynamicResolvers[tableName] = async (
        _: any,
        {
          limit = 10,
          offset = 0,
          where,
          orderBy = 'id',
          orderDirection = 'desc',
        }: {
          limit?: number;
          offset?: number;
          where?: Record<string, Record<string, any>>;
          orderBy?: string;
          orderDirection?: 'asc' | 'desc';
        }
      ) => {
        if (!dbInstance) throw new Error('Database not initialized.');

        let query = dbInstance.select().from(table);
        const filterConditions: SQL[] = [];

        if (where) {
          const dynamicConditions = buildWhereClause(table, where);
          filterConditions.push(...dynamicConditions);
        }
        
        if (filterConditions.length > 0) {
            query = query.where(and(...filterConditions));
        }

        const orderColumn = table[orderBy] ?? table['id'];

        if (!orderColumn) {
          throw new Error(
            `Invalid 'orderBy' column: '${orderBy}'. The column does not exist on table '${tableName}' and the default fallback 'lastUpdatedBlock' is also missing.`
          );
        }

        query = orderDirection === 'asc'
          ? query.orderBy(asc(orderColumn))
          : query.orderBy(desc(orderColumn));

        return await query.limit(limit).offset(offset);
      };

      // ... singular resolver logic remains the same ...
      const singularTableName = tableName.endsWith('s') ? tableName.slice(0, -1) : tableName;
      if (singularTableName !== tableName) {
        dynamicResolvers[singularTableName] = async (_: any, { key }: { key: string }) => {
          if (!dbInstance) throw new Error('Database not initialized.');
          const result = await dbInstance.select().from(table).where(eq(table.key, key));
          return result[0];
        };
      }
    }
  }
  return dynamicResolvers;
}