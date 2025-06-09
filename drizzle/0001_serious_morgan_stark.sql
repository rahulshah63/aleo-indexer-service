ALTER TABLE "events" RENAME TO "transactions";--> statement-breakpoint
ALTER TABLE "transactions" RENAME COLUMN "program_id" TO "program_name";--> statement-breakpoint
ALTER TABLE "transactions" DROP CONSTRAINT "events_transaction_id_unique";--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_transaction_id_unique" UNIQUE("transaction_id");