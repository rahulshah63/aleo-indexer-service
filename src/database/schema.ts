import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  jsonb,
  varchar,
  boolean,
  bigint,
} from "drizzle-orm/pg-core";

// General Metadata & Raw Transactions
export const indexerState = pgTable("indexer_state", {
  programName: varchar("program_name", { length: 255 }).primaryKey(),
  lastIndexedPage: integer("last_indexed_page").default(0).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  programName: text("program_name").notNull(),
  functionName: text("function_name").notNull(),
  transactionId: text("transaction_id").notNull().unique(),
  blockHeight: text("block_height").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  data: jsonb("data"), // Store all event-specific fields as JSON
});

// Reserve-Specific Data
export const reserveData = pgTable("reserve_data", {
  id: varchar("id", { length: 255 }).primaryKey(), // token_id
  lastUpdateBlockHeight: integer("last_update_block_height").notNull(),
  liquidityRate: bigint("liquidity_rate", { mode: "number" }).notNull(),
  borrowRate: bigint("borrow_rate", { mode: "number" }).notNull(),
  liquidityCumulativeIndex: bigint("liquidity_cumulative_index", {
    mode: "number",
  }).notNull(),
  borrowCumulativeIndex: bigint("borrow_cumulative_index", {
    mode: "number",
  }).notNull(),
  totalBorrowedAmount: bigint("total_borrowed_amount", {
    mode: "number",
  }).notNull(),
  totalDepositedAmount: bigint("total_deposited_amount", {
    mode: "number",
  }).notNull(),
  totalAvailableLiquidity: bigint("total_available_liquidity", {
    mode: "number",
  }).notNull(),
});

export const reserveConfig = pgTable("reserve_config", {
  id: varchar("id", { length: 255 }).primaryKey(), // token_id
  decimals: integer("decimals").notNull(),
  baseLTVAsCollateral: bigint("base_ltv_as_collateral", {
    mode: "number",
  }).notNull(),
  liquidationThreshold: bigint("liquidation_threshold", {
    mode: "number",
  }).notNull(),
  liquidationBonus: bigint("liquidation_bonus", { mode: "number" }).notNull(),
  optimalUtilizationRate: bigint("optimal_utilization_rate", {
    mode: "number",
  }).notNull(),
  baseBorrowRate: bigint("base_borrow_rate", { mode: "number" }).notNull(),
  borrowThreshold: bigint("borrow_threshold", { mode: "number" }).notNull(),
  isFreezed: boolean("is_freezed").notNull(),
  isActive: boolean("is_active").notNull(),
});

// User-Specific Data
export const userData = pgTable("user_data", {
  id: varchar("id", { length: 255 }).primaryKey(), // user_address
  lastUpdatedBlockHeight: integer("last_updated_block_height").notNull(),
  totalLiquidityBalanceUSD: bigint("total_liquidity_balance_usd", {
    mode: "number",
  }).notNull(),
  totalCollateralBalanceUSD: bigint("total_collateral_balance_usd", {
    mode: "number",
  }).notNull(),
  totalBorrowBalanceUSD: bigint("total_borrow_balance_usd", {
    mode: "number",
  }).notNull(),
  totalFeesUSD: bigint("total_fees_usd", { mode: "number" }).notNull(),
  availableBorrowUSD: bigint("available_borrow_usd", {
    mode: "number",
  }).notNull(),
  currentLTV: bigint("current_ltv", { mode: "number" }).notNull(),
  currentLiquidationThreshold: bigint("current_liquidation_threshold", {
    mode: "number",
  }).notNull(),
  borrowingPower: bigint("borrowing_power", { mode: "number" }).notNull(),
  healthFactorBelowThreshold: boolean(
    "health_factor_below_threshold"
  ).notNull(),
  collateralNeededInUSD: bigint("collateral_needed_in_usd", {
    mode: "number",
  }).notNull(),
});

export const userReserveState = pgTable("user_reserve_state", {
  id: serial("id").primaryKey(),
  userAddress: varchar("user_address", { length: 255 })
    .notNull()
    .references(() => userData.id),
  reserveId: varchar("reserve_id", { length: 255 })
    .notNull()
    .references(() => reserveData.id),
  borrowedAmount: bigint("borrowed_amount", { mode: "number" }).notNull(),
  depositedAmount: bigint("deposited_amount", { mode: "number" }).notNull(),
  userCumulativeIndex: bigint("user_cumulative_index", {
    mode: "number",
  }).notNull(),
});

export const tables = {
  transactions,
  indexerState,
  reserveData,
  reserveConfig,
  userData,
  userReserveState,
};