import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';
import { logger } from '../internal/logger.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
    logger.info('Database pool connected');
});

pool.on('error', (err) => {
    logger.error({ err }, 'Unexpected database pool error');
    process.exit(-1);
});

export const db = drizzle(pool, { schema, logger: false });