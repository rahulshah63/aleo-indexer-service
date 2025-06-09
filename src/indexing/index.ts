import config from '../../indexer.config.js';
import type { ProgramConfig } from '../../indexer.config.js';
import { logger } from '../internal/logger.js';
import { db } from '../database/db.js';
import { tables } from '../database/schema.js';
import { handleProgramEvents } from './handlers.js';
import pLimit from 'p-limit';
import { eq } from 'drizzle-orm';

async function getLastIndexedPage(programId: string): Promise<number> {
  const result = await db.select()
    .from(tables.indexerState)
    .where(eq(tables.indexerState.programId, programId)); 
  return result[0]?.lastIndexedPage ?? 0;
}

async function updateLastIndexedPage(programId: string, page: number) {
  await db.insert(tables.indexerState)
    .values({ programId, lastIndexedPage: page })
    .onConflictDoUpdate({ target: tables.indexerState.programId, set: { lastIndexedPage: page } });
}

async function processProgram(program: ProgramConfig) { // Expect ProgramConfig type
  // Use program.id for state tracking
  const lastPage = await getLastIndexedPage(program.id);
  logger.info({service: 'indexer', msg: `Processing program ${program.id} starting from page ${lastPage}`});

  // Call the generic handler for this program
  const nextPage = await handleProgramEvents(program, lastPage);

  if (nextPage > lastPage) {
    await updateLastIndexedPage(program.id, nextPage); // Use program.id for state update
    logger.info({ service: 'indexer', msg: `Program ${program.id} indexed up to page ${nextPage}` });
  }
}

export async function runIndexer() {
  logger.info({ service: 'indexer', msg: "Starting indexer..." });
  const limit = pLimit(5); // Concurrency limit

  const run = async () => {
    // Map over the programs defined in indexer.config.ts
    const tasks = config.map(program =>
      limit(() => processProgram(program).catch(e => logger.error({ service: 'indexer', msg: `Error processing program ${program.id}`, error: e })))
    );
    await Promise.all(tasks);
    setTimeout(run, 30000); // Run every 30 seconds
  };
  
  await run();
}