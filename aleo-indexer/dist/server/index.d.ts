import { Hono } from 'hono';
import { DbInstance, GeneratedSchema } from '../utils/types.js';
/**
 * Initializes the GraphQL server with the provided DB connection, generated schema, and GraphQL schema path.
 * This function will be called by the `aleo-indexer start` command.
 * @param db The Drizzle DB instance.
 * @param schema The dynamically loaded Drizzle schema tables.
 * @param gqlSchemaPath The path to the generated GraphQL schema file.
 * @returns The Hono application instance.
 */
export declare function initializeGraphQLServer(db: DbInstance, schema: GeneratedSchema, gqlSchemaPath: string): Promise<Hono<import("hono/types").BlankEnv, import("hono/types").BlankSchema, "/">>;
