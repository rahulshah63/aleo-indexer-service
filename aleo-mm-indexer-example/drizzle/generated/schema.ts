
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

export const market_reserves = pgTable("market_reserves", {
  id: serial("id").primaryKey(),
  transactionId: varchar("transaction_id", { length: 255 }).notNull(),
  token_id: varchar("token_id", { length: 255 }),
  liquidity_cumulative_index: bigint("liquidity_cumulative_index", { mode: "number" }),
  borrow_cumulative_index: bigint("borrow_cumulative_index", { mode: "number" }),
  base_LTV_as_collateral: bigint("base_LTV_as_collateral", { mode: "number" }),
  liquidation_threshold: bigint("liquidation_threshold", { mode: "number" }),
  liquidation_bonus: bigint("liquidation_bonus", { mode: "number" }),
  decimals: smallint("decimals"),
  optimal_utilization_rate: bigint("optimal_utilization_rate", { mode: "number" }),
  base_borrow_rate: bigint("base_borrow_rate", { mode: "number" }),
  is_freezed: boolean("is_freezed"),
  is_active: boolean("is_active"),
  borrow_threshold: bigint("borrow_threshold", { mode: "number" }),
  callerAddress: text("callerAddress"),
});

export const market_reservesRelations = relations(market_reserves, ({ one }) => ({
  transaction: one(transactions, {
    fields: [market_reserves.transactionId],
    references: [transactions.id],
  }),
}));

