
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
  inserted_at: timestamp("timestamp").notNull(),   // Transaction insertion timestamp
  raw: jsonb("raw"),                             // Store the raw transaction object as JSONB
});

// Define relations for the base transactions table (if any future tables link to it)
export const transactionsRelations = relations(transactions, ({ many }) => ({
  // Link to function-specific event tables
  // Example: depositTokenEvents: many(depositTokenEvents),
}));

// --- Auto-Generated Tables from indexer.config.ts ---

export const market_reserves_historicals = pgTable("market_reserves_historicals", {
  id: serial("id").primaryKey(),
  transactionId: varchar("transaction_id", { length: 255 }).notNull(),
  token_id_cipher: varchar("token_id_cipher", { length: 255 }),
  liquidity_cumulative_index_cipher: varchar("liquidity_cumulative_index_cipher", { length: 255 }),
  borrow_cumulative_index_cipher: varchar("borrow_cumulative_index_cipher", { length: 255 }),
  base_LTV_as_collateral_cipher: varchar("base_LTV_as_collateral_cipher", { length: 255 }),
  liquidation_threshold_cipher: varchar("liquidation_threshold_cipher", { length: 255 }),
  liquidation_bonus_cipher: varchar("liquidation_bonus_cipher", { length: 255 }),
  decimals_cipher: varchar("decimals_cipher", { length: 255 }),
  optimal_utilization_rate_cipher: varchar("optimal_utilization_rate_cipher", { length: 255 }),
  base_borrow_rate_cipher: varchar("base_borrow_rate_cipher", { length: 255 }),
  is_freezed_cipher: varchar("is_freezed_cipher", { length: 255 }),
  is_active_cipher: varchar("is_active_cipher", { length: 255 }),
  borrow_threshold_cipher: varchar("borrow_threshold_cipher", { length: 255 }),
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

export const market_reserves_historicalsRelations = relations(market_reserves_historicals, ({ one }) => ({
  transaction: one(transactions, {
    fields: [market_reserves_historicals.transactionId],
    references: [transactions.id],
  }),
}));

export const reserve_data = pgTable("reserve_data", {
  key: varchar("key", { length: 255 }).primaryKey(),
  value: jsonb("value").notNull(),
  lastUpdatedBlock: integer("last_updated_block").notNull(),
});

export const reserve_config = pgTable("reserve_config", {
  key: varchar("key", { length: 255 }).primaryKey(),
  value: jsonb("value").notNull(),
  lastUpdatedBlock: integer("last_updated_block").notNull(),
});

export const total_deposited_amount = pgTable("total_deposited_amount", {
  key: varchar("key", { length: 255 }).primaryKey(),
  value: bigint("value", { mode: "number" }).notNull(),
  lastUpdatedBlock: integer("last_updated_block").notNull(),
});

export const total_borrowed_amount = pgTable("total_borrowed_amount", {
  key: varchar("key", { length: 255 }).primaryKey(),
  value: bigint("value", { mode: "number" }).notNull(),
  lastUpdatedBlock: integer("last_updated_block").notNull(),
});

export const total_available_liquidity = pgTable("total_available_liquidity", {
  key: varchar("key", { length: 255 }).primaryKey(),
  value: bigint("value", { mode: "number" }).notNull(),
  lastUpdatedBlock: integer("last_updated_block").notNull(),
});

export const deposited_amount = pgTable("deposited_amount", {
  key: varchar("key", { length: 255 }).primaryKey(),
  value: bigint("value", { mode: "number" }).notNull(),
  lastUpdatedBlock: integer("last_updated_block").notNull(),
});

export const borrowed_amount = pgTable("borrowed_amount", {
  key: varchar("key", { length: 255 }).primaryKey(),
  value: bigint("value", { mode: "number" }).notNull(),
  lastUpdatedBlock: integer("last_updated_block").notNull(),
});

export const user_cumulative_index = pgTable("user_cumulative_index", {
  key: varchar("key", { length: 255 }).primaryKey(),
  value: bigint("value", { mode: "number" }).notNull(),
  lastUpdatedBlock: integer("last_updated_block").notNull(),
});

export const usersdata = pgTable("usersdata", {
  key: varchar("key", { length: 255 }).primaryKey(),
  value: jsonb("value").notNull(),
  lastUpdatedBlock: integer("last_updated_block").notNull(),
});

export const deposits_historicals = pgTable("deposits_historicals", {
  id: serial("id").primaryKey(),
  transactionId: varchar("transaction_id", { length: 255 }).notNull(),
  token_id: varchar("token_id", { length: 255 }),
  amount: bigint("amount", { mode: "number" }),
  user_hash: varchar("user_hash", { length: 255 }),
});

export const deposits_historicalsRelations = relations(deposits_historicals, ({ one }) => ({
  transaction: one(transactions, {
    fields: [deposits_historicals.transactionId],
    references: [transactions.id],
  }),
}));

export const borrows_historicals = pgTable("borrows_historicals", {
  id: serial("id").primaryKey(),
  transactionId: varchar("transaction_id", { length: 255 }).notNull(),
  token_id: varchar("token_id", { length: 255 }),
  user_hash: varchar("user_hash", { length: 255 }),
  user_key: varchar("user_key", { length: 255 }),
  borrow_amount: bigint("borrow_amount", { mode: "number" }),
  repay_amount: bigint("repay_amount", { mode: "number" }),
});

export const borrows_historicalsRelations = relations(borrows_historicals, ({ one }) => ({
  transaction: one(transactions, {
    fields: [borrows_historicals.transactionId],
    references: [transactions.id],
  }),
}));

export const withdraws_historicals = pgTable("withdraws_historicals", {
  id: serial("id").primaryKey(),
  transactionId: varchar("transaction_id", { length: 255 }).notNull(),
  token_id: varchar("token_id", { length: 255 }),
  user_hash: varchar("user_hash", { length: 255 }),
  user_key: varchar("user_key", { length: 255 }),
  withdraw_amount: bigint("withdraw_amount", { mode: "number" }),
});

export const withdraws_historicalsRelations = relations(withdraws_historicals, ({ one }) => ({
  transaction: one(transactions, {
    fields: [withdraws_historicals.transactionId],
    references: [transactions.id],
  }),
}));

export const repays_historicals = pgTable("repays_historicals", {
  id: serial("id").primaryKey(),
  transactionId: varchar("transaction_id", { length: 255 }).notNull(),
  token_id: varchar("token_id", { length: 255 }),
  user_hash: varchar("user_hash", { length: 255 }),
  repay_amount: bigint("repay_amount", { mode: "number" }),
});

export const repays_historicalsRelations = relations(repays_historicals, ({ one }) => ({
  transaction: one(transactions, {
    fields: [repays_historicals.transactionId],
    references: [transactions.id],
  }),
}));

