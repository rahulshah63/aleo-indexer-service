
import { pgTable, serial, text, varchar, timestamp, jsonb, integer, bigint, boolean, smallint } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm'; // Import relations for defining relationships

// --- Base Indexer Tables (Always Included) ---

// Table to track the indexing progress for each program
export const indexerState = pgTable("indexer_state", {
  programName: varchar("program_name", { length: 255 }).primaryKey(),
  lastIndexedBlock: integer("last_indexed_block").default(0).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

// Table to store raw Aleo transaction details that are indexed
export const transactions = pgTable("transactions", {
  id: varchar("id", { length: 255 }).primaryKey(), // Aleo transaction_id
  programId: text("program_id").notNull(),       // The Aleo program ID
  functionName: text("function_name").notNull(), // The Aleo function name
  blockHeight: integer("block_height").notNull(),
  timestamp: timestamp("timestamp").notNull(),   // Transaction finalized timestamp
  raw: jsonb("raw"),                             // Store the raw transaction object as JSONB
});

// Define relations for the base transactions table (if any future tables link to it)
export const transactionsRelations = relations(transactions, ({ many }) => ({
  // Link to function-specific event tables
  // Example: depositTokenEvents: many(depositTokenEvents),
}));

// --- Auto-Generated Tables from indexer.config.ts ---

export const token_registrations = pgTable("token_registrations", {
  id: serial("id").primaryKey(),
  transactionId: varchar("transaction_id", { length: 255 }).notNull(),
  token_id: varchar("token_id", { length: 255 }),
  token_symbol: varchar("token_symbol", { length: 255 }),
  decimals: smallint("decimals"),
  supply_public: bigint("supply_public", { mode: "number" }),
  callerAddress: text("callerAddress"),
});

export const token_registrationsRelations = relations(token_registrations, ({ one }) => ({
  transaction: one(transactions, {
    fields: [token_registrations.transactionId],
    references: [transactions.id],
  }),
}));

export const public_transfers = pgTable("public_transfers", {
  id: serial("id").primaryKey(),
  transactionId: varchar("transaction_id", { length: 255 }).notNull(),
  token_id: varchar("token_id", { length: 255 }),
  sender: varchar("sender", { length: 63 }),
  receiver: varchar("receiver", { length: 63 }),
  amount: bigint("amount", { mode: "number" }),
});

export const public_transfersRelations = relations(public_transfers, ({ one }) => ({
  transaction: one(transactions, {
    fields: [public_transfers.transactionId],
    references: [transactions.id],
  }),
}));

export const token_data_map = pgTable("token_data_map", {
  key: varchar("key", { length: 255 }).primaryKey(),
  value: jsonb("value").notNull(),
  lastUpdatedBlock: integer("last_updated_block").notNull(),
});

