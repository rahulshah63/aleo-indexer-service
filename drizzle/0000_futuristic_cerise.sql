CREATE TABLE "indexer_state" (
	"program_name" varchar(255) PRIMARY KEY NOT NULL,
	"last_indexed_page" integer DEFAULT 0 NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_id" text NOT NULL,
	"function_name" text NOT NULL,
	"transaction_id" text NOT NULL,
	"block_height" text NOT NULL,
	"timestamp" timestamp NOT NULL,
	"data" jsonb,
	CONSTRAINT "events_transaction_id_unique" UNIQUE("transaction_id")
);
