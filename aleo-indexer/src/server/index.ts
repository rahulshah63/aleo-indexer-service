// aleo-indexer/src/server/index.ts

import { Hono } from "hono";
import { createYoga } from "graphql-yoga";
import { createSchema } from "graphql-yoga";
import { readFileSync } from "node:fs";
import { asc, desc, eq } from "drizzle-orm";
import { logger } from "../utils/logger.js";
import { DbInstance, GeneratedSchema } from "../utils/types.js";
import GraphQLJSON from "graphql-type-json";
import { GraphQLBigInt, GraphQLDateTime } from "graphql-scalars";

// Global variables to hold the dynamically loaded DB and schema
let dbInstance: DbInstance | null = null;
let generatedSchema: GeneratedSchema | null = null;
let graphQLSchemaPath: string | null = null;

/**
 * Initializes the GraphQL server with the provided DB connection, generated schema, and GraphQL schema path.
 * This function will be called by the `aleo-indexer start` command.
 * @param db The Drizzle DB instance.
 * @param schema The dynamically loaded Drizzle schema tables.
 * @param gqlSchemaPath The path to the generated GraphQL schema file.
 * @returns The Hono application instance.
 */
export async function initializeGraphQLServer(
  db: DbInstance,
  schema: GeneratedSchema,
  gqlSchemaPath: string
) {
  dbInstance = db;
  generatedSchema = schema;
  graphQLSchemaPath = gqlSchemaPath;

  const app = new Hono();

  // Load the generated GraphQL schema
  const typeDefs = readFileSync(graphQLSchemaPath, "utf-8");

  // Dynamically create resolvers based on the generated schema
  const resolvers = {
    Query: {
      transactions: async (
        _: any,
        {
          limit = 10,
          offset = 0,
          programId,
          functionName,
          where,
          orderBy = "blockHeight",
          orderDirection = "desc",
        }: {
          limit?: number;
          offset?: number;
          programId?: string;
          functionName?: string;
          where?: Record<string, any>;
          orderBy?: "blockHeight" | "timestamp" | "programId" | "functionName";
          orderDirection?: "asc" | "desc";
        }
      ) => {
        if (!generatedSchema || !dbInstance)
          throw new Error("Database or schema not initialized.");

        const { and, eq, asc, desc } = await import("drizzle-orm");
        let query = dbInstance.select().from(generatedSchema.transactions);
        const filterConditions = [];

        // Handle dedicated filters
        if (programId) {
          filterConditions.push(
            eq(generatedSchema.transactions.programId, programId)
          );
        }
        if (functionName) {
          filterConditions.push(
            eq(generatedSchema.transactions.functionName, functionName)
          );
        }

        // Handle generic 'where' clause for dynamic filtering
        if (where) {
          for (const key in where) {
            if (
              Object.prototype.hasOwnProperty.call(
                generatedSchema.transactions,
                key
              )
            ) {
              const column =
                generatedSchema.transactions[
                  key as keyof typeof generatedSchema.transactions
                ];
              const value = where[key];
              // This implementation uses basic equality. For more complex operators like
              // 'greater than' or 'in', you would expand the logic here.
              filterConditions.push(eq(column, value));
            }
          }
        }

        // Apply all collected filters if any exist
        if (filterConditions.length > 0) {
          query = query.where(and(...filterConditions));
        }

        // Apply ordering
        const orderColumn = generatedSchema.transactions[orderBy];
        query =
          orderDirection === "asc"
            ? query.orderBy(asc(orderColumn))
            : query.orderBy(desc(orderColumn));

        // Apply pagination
        query = query.limit(limit).offset(offset);

        return await query;
      },
      transaction: async (_: any, { id }: { id: string }) => {
        if (!generatedSchema || !dbInstance)
          throw new Error("Database or schema not initialized.");
        const { eq } = await import("drizzle-orm");
        const result = await dbInstance
          .select()
          .from(generatedSchema.transactions)
          .where(eq(generatedSchema.transactions.id, id));
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
  logger.info(
    `Generated GraphQL Resolvers: ${Object.keys(resolvers.Query)
      .map((key) => key)
      .join(", ")}...`
  );

  const yoga = createYoga({
    schema: createSchema({
      typeDefs,
      resolvers,
    }),
    graphiql: true, // Enable GraphiQL IDE for testing
  });
  //@ts-expect-error
  app.use("/graphql", (c) => yoga({ request: c.req.raw }));

  // Return the Hono app instance for serving
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
    if (tableName === "transactions" || tableName === "indexerState") {
      continue;
    }

    const table = schema[tableName];
    if (typeof table === "object" && table !== null && "getSQL" in table) {
      // Resolver for fetching many records with ordering and filtering support
      dynamicResolvers[tableName] = async (
        _: any,
        {
          limit = 10,
          offset = 0,
          where,
          orderBy = "lastUpdatedBlock",
          orderDirection = "desc",
        }: {
          limit?: number;
          offset?: number;
          where?: Record<string, any>; // Define the where clause type
          orderBy?: string;
          orderDirection?: "asc" | "desc";
        }
      ) => {
        if (!dbInstance) throw new Error("Database not initialized.");
        const { and, eq, asc, desc } = await import('drizzle-orm');

        // Start building the query
        let query = dbInstance.select().from(table);
        const filterConditions = [];

        // Handle generic 'where' clause for dynamic filtering
        if (where) {
          for (const key in where) {
            // Check if the key is a valid column on the current table
            if (Object.prototype.hasOwnProperty.call(table, key)) {
              const column = table[key as keyof typeof table];
              const value = where[key];
              filterConditions.push(eq(column, value));
            }
          }
        }

        // Apply all collected filters if any exist
        if (filterConditions.length > 0) {
          query = query.where(and(...filterConditions));
        }

        // Apply ordering to the (potentially filtered) query
        // Defensive check: if orderBy column does not exist, fallback to a default
        const orderColumn = table[orderBy] ?? table["lastUpdatedBlock"];
        query = orderDirection === 'asc'
          ? query.orderBy(asc(orderColumn))
          : query.orderBy(desc(orderColumn));

        // Apply pagination and execute the query
        return await query.limit(limit).offset(offset);
      };

      // Resolver for fetching single record by key (for mappings)
      const singularTableName = tableName.endsWith("s")
        ? tableName.slice(0, -1)
        : tableName;
      if (singularTableName !== tableName && table.key) { // Also check if 'key' column exists
        dynamicResolvers[singularTableName] = async (
          _: any,
          { key }: { key: string }
        ) => {
          if (!dbInstance) throw new Error("Database not initialized.");
          const { eq } = await import('drizzle-orm');
          const result = await dbInstance
            .select()
            .from(table)
            .where(eq(table.key, key));
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
