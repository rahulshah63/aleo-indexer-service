
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
  token_id_cipherd: varchar("token_id_cipherd", { length: 255 }),
  liquidity_cumulative_index_cipherd: varchar("liquidity_cumulative_index_cipherd", { length: 255 }),
  borrow_cumulative_index_cipherd: varchar("borrow_cumulative_index_cipherd", { length: 255 }),
  base_LTV_as_collateral_cipherd: varchar("base_LTV_as_collateral_cipherd", { length: 255 }),
  liquidation_threshold_cipherd: varchar("liquidation_threshold_cipherd", { length: 255 }),
  liquidation_bonus_cipherd: varchar("liquidation_bonus_cipherd", { length: 255 }),
  decimals_cipherd: varchar("decimals_cipherd", { length: 255 }),
  optimal_utilization_rate_cipherd: varchar("optimal_utilization_rate_cipherd", { length: 255 }),
  base_borrow_rate_cipherd: varchar("base_borrow_rate_cipherd", { length: 255 }),
  is_freezed_cipherd: varchar("is_freezed_cipherd", { length: 255 }),
  is_active_cipherd: varchar("is_active_cipherd", { length: 255 }),
  borrow_threshold_cipherd: varchar("borrow_threshold_cipherd", { length: 255 }),
  user_address: varchar("user_address", { length: 63 }),
  last_update_block_height: integer("last_update_block_height"),
  liquidity_rate: bigint("liquidity_rate", { mode: "number" }),
  borrow_rate: bigint("borrow_rate", { mode: "number" }),
  liquidity_cumulative_index: bigint("liquidity_cumulative_index", { mode: "number" }),
  borrow_cumulative_index: bigint("borrow_cumulative_index", { mode: "number" }),
  token_id: varchar("token_id", { length: 255 }),
  decimals: smallint("decimals"),
  base_LTV_as_collateral: bigint("base_LTV_as_collateral", { mode: "number" }),
  liquidation_threshold: bigint("liquidation_threshold", { mode: "number" }),
  liquidation_bonus: bigint("liquidation_bonus", { mode: "number" }),
  optimal_utilization_rate: bigint("optimal_utilization_rate", { mode: "number" }),
  base_borrow_rate: bigint("base_borrow_rate", { mode: "number" }),
  borrow_threshold: bigint("borrow_threshold", { mode: "number" }),
  is_freezed: boolean("is_freezed"),
  is_active: boolean("is_active"),
});

export const market_reservesRelations = relations(market_reserves, ({ one }) => ({
  transaction: one(transactions, {
    fields: [market_reserves.transactionId],
    references: [transactions.id],
  }),
}));

