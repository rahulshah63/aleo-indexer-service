import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import 'dotenv/config'; 

import * as schema from './generated/schema.js'; // Import all generated schema tables
import * as relations from './generated/relations.js'; // Import relations

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set.');
}

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize Drizzle ORM with the pool and imported schema/relations
export const db = drizzle(pool, { schema: { ...schema, ...relations } });

// Re-export the schema for easier access in the indexer and server components
export * as schema from './generated/schema.js';