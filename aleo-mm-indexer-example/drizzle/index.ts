import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import 'dotenv/config'; 

import * as schema from './generated/schema.js';
import * as relations from './generated/relations.js';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema: { ...schema, ...relations } });

// Re-export the schema for easier access in the indexer and server components
export * as schema from './generated/schema.js';