import { pgTable, varchar, text, integer, timestamp, jsonb, serial, primaryKey } from 'drizzle-orm/pg-core';

export const transactions = pgTable('events', {
  id: serial('id').primaryKey(),
  programId: text('program_id').notNull(),
  functionName: text('function_name').notNull(),
  transactionId: text('transaction_id').notNull().unique(), // Or composite unique
  blockHeight: text('block_height').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  data: jsonb('data'), // Store all event-specific fields as JSON
});

export const indexerState = pgTable('indexer_state', {
    programName: varchar('program_name', { length: 255 }).primaryKey(),
    lastIndexedPage: integer('last_indexed_page').notNull().default(0),
    lastUpdated: timestamp('last_updated').notNull().defaultNow(),
});

// Export a handy object for relations or quick access
export const tables = { transactions, indexerState };
