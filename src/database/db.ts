import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';
import { logger } from '../internal/logger.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
    logger.info({ service: 'db', msg: 'Database connection established' });
});

pool.on('error', (err) => {
    logger.error({ service: 'db', msg: 'Database connection error', error: err });
    process.exit(-1);
});

export const db = drizzle(pool, { schema, logger: false });