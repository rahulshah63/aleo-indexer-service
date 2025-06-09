import config from "../../indexer.config.js";
import { ProgramConfig } from "../config/program.js";
import { logger } from "../internal/logger.js";
import { db } from "../database/db.js";
import { tables } from "../database/schema.js";
import { handleProgramEvents } from "./handlers.js";
import pLimit from "p-limit";
import { eq } from "drizzle-orm";

async function getLastIndexedPage(programName: string): Promise<number> {
  const result = await db
    .select()
    .from(tables.indexerState)
    .where(eq(tables.indexerState.programName, programName));
  return result[0]?.lastIndexedPage ?? 0;
}

async function updateLastIndexedPage(programName: string, page: number) {
  await db
    .insert(tables.indexerState)
    .values({ programName, lastIndexedPage: page })
    .onConflictDoUpdate({
      target: tables.indexerState.programName,
      set: { lastIndexedPage: page },
    });
}

async function processProgram(program: ProgramConfig) {
  // Use program.id for state tracking
  const lastPage = await getLastIndexedPage(program.programName);
  logger.info({
    service: "indexer",
    msg: `Processing program ${program.programName} starting from page ${lastPage}`,
  });

  // Call the generic handler for this program
  const nextPage = await handleProgramEvents(program, lastPage);

  if (nextPage > lastPage) {
    await updateLastIndexedPage(program.programName, nextPage); // Use program.id for state update
    logger.info({
      service: "indexer",
      msg: `Program ${program.programName} indexed up to page ${nextPage}`,
    });
  }
}

export async function runIndexer() {
  // Validate environment variables
  const requiredEnvVars = ["RPC_URL", "DATABASE_URL"];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
  logger.info({ service: "indexer", msg: "Starting indexer..." });
  const limit = pLimit(5); // Concurrency limit

  const run = async () => {
    // Map over the programs defined in indexer.config.ts
    const tasks = config.programs.map((program) =>
      limit(() =>
        processProgram(program).catch((e) =>
          logger.error({
            service: "indexer",
            msg: `Error processing program ${program.id}`,
            error: e,
          })
        )
      )
    );
    await Promise.all(tasks);
    setTimeout(run, 30000); // Run every 30 seconds
  };

  await run();
}
