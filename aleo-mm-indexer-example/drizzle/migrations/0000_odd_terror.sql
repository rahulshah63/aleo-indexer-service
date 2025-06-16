CREATE TABLE "borrowed_amount" (
	"key" varchar(255) PRIMARY KEY NOT NULL,
	"value" bigint NOT NULL,
	"last_updated_block" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "borrows_historicals" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_id" varchar(255) NOT NULL,
	"token_id" varchar(255),
	"user_hash" varchar(255),
	"user_key" varchar(255),
	"borrow_amount" bigint,
	"repay_amount" bigint
);
--> statement-breakpoint
CREATE TABLE "deposited_amount" (
	"key" varchar(255) PRIMARY KEY NOT NULL,
	"value" bigint NOT NULL,
	"last_updated_block" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deposits_historicals" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_id" varchar(255) NOT NULL,
	"token_id" varchar(255),
	"amount" bigint,
	"user_hash" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "indexer_state" (
	"program_name" varchar(255) PRIMARY KEY NOT NULL,
	"last_indexed_block" integer DEFAULT 0 NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_reserves_historicals" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_id" varchar(255) NOT NULL,
	"token_id_cipher" varchar(255),
	"liquidity_cumulative_index_cipher" varchar(255),
	"borrow_cumulative_index_cipher" varchar(255),
	"base_LTV_as_collateral_cipher" varchar(255),
	"liquidation_threshold_cipher" varchar(255),
	"liquidation_bonus_cipher" varchar(255),
	"decimals_cipher" varchar(255),
	"optimal_utilization_rate_cipher" varchar(255),
	"base_borrow_rate_cipher" varchar(255),
	"is_freezed_cipher" varchar(255),
	"is_active_cipher" varchar(255),
	"borrow_threshold_cipher" varchar(255),
	"user_address" varchar(63),
	"last_update_block_height" integer,
	"liquidity_rate" bigint,
	"borrow_rate" bigint,
	"liquidity_cumulative_index" bigint,
	"borrow_cumulative_index" bigint,
	"token_id" varchar(255),
	"decimals" smallint,
	"base_LTV_as_collateral" bigint,
	"liquidation_threshold" bigint,
	"liquidation_bonus" bigint,
	"optimal_utilization_rate" bigint,
	"base_borrow_rate" bigint,
	"borrow_threshold" bigint,
	"is_freezed" boolean,
	"is_active" boolean
);
--> statement-breakpoint
CREATE TABLE "repays_historicals" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_id" varchar(255) NOT NULL,
	"token_id" varchar(255),
	"user_hash" varchar(255),
	"repay_amount" bigint
);
--> statement-breakpoint
CREATE TABLE "reserve_config" (
	"key" varchar(255) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"last_updated_block" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reserve_data" (
	"key" varchar(255) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"last_updated_block" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "total_available_liquidity" (
	"key" varchar(255) PRIMARY KEY NOT NULL,
	"value" bigint NOT NULL,
	"last_updated_block" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "total_borrowed_amount" (
	"key" varchar(255) PRIMARY KEY NOT NULL,
	"value" bigint NOT NULL,
	"last_updated_block" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "total_deposited_amount" (
	"key" varchar(255) PRIMARY KEY NOT NULL,
	"value" bigint NOT NULL,
	"last_updated_block" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"program_id" text NOT NULL,
	"function_name" text NOT NULL,
	"block_height" integer NOT NULL,
	"timestamp" timestamp NOT NULL,
	"raw" jsonb
);
--> statement-breakpoint
CREATE TABLE "user_cumulative_index" (
	"key" varchar(255) PRIMARY KEY NOT NULL,
	"value" bigint NOT NULL,
	"last_updated_block" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usersdata" (
	"key" varchar(255) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"last_updated_block" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "withdraws_historicals" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_id" varchar(255) NOT NULL,
	"token_id" varchar(255),
	"user_hash" varchar(255),
	"user_key" varchar(255),
	"withdraw_amount" bigint
);
