CREATE TABLE "indexer_state" (
	"program_name" varchar(255) PRIMARY KEY NOT NULL,
	"last_indexed_block" integer DEFAULT 0 NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_reserves" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_id" varchar(255) NOT NULL,
	"token_id" varchar(255),
	"liquidity_cumulative_index" bigint,
	"borrow_cumulative_index" bigint,
	"base_LTV_as_collateral" bigint,
	"liquidation_threshold" bigint,
	"liquidation_bonus" bigint,
	"decimals" smallint,
	"optimal_utilization_rate" bigint,
	"base_borrow_rate" bigint,
	"is_freezed" boolean,
	"is_active" boolean,
	"borrow_threshold" bigint,
	"callerAddress" text
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
