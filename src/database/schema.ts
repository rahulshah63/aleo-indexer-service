import { pgTable, varchar, text, integer, timestamp, jsonb, serial } from 'drizzle-orm/pg-core';

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
    lastIndexedPage: integer('last_indexed_page').default(0).notNull(),
    lastUpdated: timestamp('last_updated').defaultNow().notNull(),
});

// Export a handy object for relations or quick access
export const tables = { transactions, indexerState };
