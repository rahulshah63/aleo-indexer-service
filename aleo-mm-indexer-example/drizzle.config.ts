import type { Config } from 'drizzle-kit';
import 'dotenv/config';

export default {
  schema: './drizzle/generated/schema.ts', // Path to your generated Drizzle schema
  out: './drizzle/migrations',        // Directory for migration files
  dialect: 'postgresql',                  // Add the required dialect property
  dbCredentials: {
    url: process.env.DATABASE_URL!, // Use DATABASE_URL from .env
  },
  verbose: true,
  strict: true,
} satisfies Config;