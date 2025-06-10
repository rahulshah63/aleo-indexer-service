// aleo-indexer/src/server/index.ts
import { Hono } from 'hono';
import { createYoga } from 'graphql-yoga';
import { createSchema } from 'graphql-yoga';
import { readFileSync } from 'node:fs';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
// Global variables to hold the dynamically loaded DB and schema
let dbInstance = null;
let generatedSchema = null;
let graphQLSchemaPath = null;
/**
 * Initializes the GraphQL server with the provided DB connection, generated schema, and GraphQL schema path.
 * This function will be called by the `aleo-indexer start` command.
 * @param db The Drizzle DB instance.
 * @param schema The dynamically loaded Drizzle schema tables.
 * @param gqlSchemaPath The path to the generated GraphQL schema file.
 * @returns The Hono application instance.
 */
export async function initializeGraphQLServer(db, schema, gqlSchemaPath) {
    dbInstance = db;
    generatedSchema = schema;
    graphQLSchemaPath = gqlSchemaPath;
    const app = new Hono();
    // Load the generated GraphQL schema
    const typeDefs = readFileSync(graphQLSchemaPath, 'utf-8');
    // Dynamically create resolvers based on the generated schema
    const resolvers = {
        Query: {
            transactions: async (_, { limit = 10, offset = 0, programId, functionName }) => {
                if (!generatedSchema || !dbInstance)
                    throw new Error('Database or schema not initialized.');
                let query = dbInstance.select().from(generatedSchema.transactions);
                if (programId) {
                    query = query.where(eq(generatedSchema.transactions.programId, programId));
                }
                if (functionName) {
                    query = query.where(eq(generatedSchema.transactions.functionName, functionName));
                }
                query = query.orderBy(generatedSchema.transactions.blockHeight).limit(limit).offset(offset);
                return await query;
            },
            transaction: async (_, { id }) => {
                if (!generatedSchema || !dbInstance)
                    throw new Error('Database or schema not initialized.');
                const result = await dbInstance.select().from(generatedSchema.transactions).where(eq(generatedSchema.transactions.id, id));
                return result[0];
            },
            // Dynamically add resolvers for other generated tables (functions and mappings)
            ...createDynamicResolvers(generatedSchema),
        },
        // Add resolvers for custom scalars like BigInt, DateTime if needed (often handled by graphql-yoga defaults or libraries)
        BigInt: String, // Treat BigInt as String in GraphQL for now
        DateTime: String, // Treat Date/Timestamp as String in GraphQL for now
        // JSON: GraphQLJSON, // If you define a JSON scalar, you'd need a package like graphql-type-json
    };
    const yoga = createYoga({
        schema: createSchema({
            typeDefs,
            resolvers,
        }),
        graphiql: true, // Enable GraphiQL IDE for testing
    });
    //@ts-expect-error
    app.use('/graphql', (c) => yoga({ request: c.req.raw }));
    logger.info(`🚀 GraphQL Server setup complete. Will start on http://localhost:4000/graphql when Hono serves.`);
    // Return the Hono app instance for serving
    return app;
}
/**
 * Creates dynamic GraphQL resolvers for auto-generated tables.
 * @param schema The generated Drizzle schema.
 * @returns An object mapping table names to their respective resolver functions.
 */
function createDynamicResolvers(schema) {
    const dynamicResolvers = {};
    // Iterate over all tables in the schema, excluding base ones
    for (const tableName in schema) {
        if (tableName === 'transactions' || tableName === 'indexerState') {
            continue; // Skip base tables, handled explicitly
        }
        const table = schema[tableName];
        if (typeof table === 'object' && table !== null && 'getSQL' in table) { // Check if it's a Drizzle table object
            // Resolver for fetching all records from a function table
            dynamicResolvers[tableName] = async (_, { limit = 10, offset = 0 }) => {
                if (!dbInstance)
                    throw new Error('Database not initialized.');
                return await dbInstance.select().from(table).limit(limit).offset(offset);
            };
            // If it's a mapping table, add a resolver for fetching by key
            // Assuming mapping table names end with 's' and singular form is needed for 'by key' query
            const singularTableName = tableName.endsWith('s') ? tableName.slice(0, -1) : tableName;
            if (singularTableName !== tableName) { // Only if it's a plural mapping table
                dynamicResolvers[singularTableName] = async (_, { key }) => {
                    if (!dbInstance)
                        throw new Error('Database not initialized.');
                    const result = await dbInstance.select().from(table).where(eq(table.key, key)); // Assuming 'key' column
                    return result[0];
                };
            }
        }
    }
    return dynamicResolvers;
}
// The `fetch` function and `port` export will be handled by Bun's `serve` directly when the CLI runs this server.
// We export the initialization function, not the app directly.
// The CLI will call `initializeGraphQLServer` and then pass the returned `app` to Bun's `serve`.
//# sourceMappingURL=index.js.map