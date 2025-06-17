// aleo-indexer/src/core/indexer.ts

import { ProgramConfig, IndexerConfig, DbInstance, GeneratedSchema } from '../utils/types.js';
import { logger } from '../utils/logger.js';
import { handleProgramFunctions, handleProgramMappings } from './processor.js';
import pLimit from 'p-limit'; // For concurrency control
import { eq, and } from 'drizzle-orm';
import 'dotenv/config';

/**
 * Retrieves the last indexed block/page for a given program and function from the database.
 * @param db The Drizzle DB instance.
 * @param schema The dynamically loaded Drizzle schema, specifically `indexerState` table.
 * @param programName The full program ID (e.g., "token_registry.aleo").
 * @param functionName The name of the function within the program (e.g., "main").
 * @returns The last indexed block/page, or 0 if not found.
 */
async function getLastIndexedBlock(db: DbInstance, schema: GeneratedSchema, programName: string, functionName: string): Promise<number> {
  const result = await db
    .select({ lastIndexedBlock: schema.indexerState.lastIndexedBlock })
    .from(schema.indexerState)
    .where(
      and(
        eq(schema.indexerState.programName, programName),
        eq(schema.indexerState.functionName, functionName)
      )
    );

  return result.length > 0 ? result[0].lastIndexedBlock : 0;
}

/**
 * Updates the last indexed block/page for a given program and function in the database.
 * @param db The Drizzle DB instance.
 * @param schema The dynamically loaded Drizzle schema, specifically `indexerState` table.
 * @param programName The full program ID.
 * @param functionName The name of the function within the program.
 * @param blockHeight The new last indexed block/page.
 */
async function updateLastIndexedBlock(db: DbInstance, schema: GeneratedSchema, programName: string, functionName: string, blockHeight: number) {
  await db
    .insert(schema.indexerState)
    .values({ programName, functionName, lastIndexedBlock: blockHeight, lastUpdated: new Date() })
    .onConflictDoUpdate({
      target: [schema.indexerState.programName, schema.indexerState.functionName], // Target composite primary key
      set: { lastIndexedBlock: blockHeight, lastUpdated: new Date() },
    });
}

/**
 * Processes a single Aleo program by coordinating the fetching and saving of function-level progress
 * based on the total number of transactions indexed.
 * @param programConfig The configuration for the program.
 * @param allProgramConfigs All program configurations for the current indexing cycle.
 * @param rpcUrl The RPC URL to use.
 * @param db The Drizzle DB instance.
 * @param schema The dynamically loaded Drizzle schema.
 */
async function processProgram(
  programConfig: ProgramConfig,
  allProgramConfigs: ProgramConfig[],
  rpcUrl: string,
  db: DbInstance,
  schema: GeneratedSchema
) {
  if (!programConfig.functions || programConfig.functions.length === 0) {
    logger.info({ service: 'indexer', msg: `Program ${programConfig.programId} has no functions to index.` });
    return;
  }

  // 1. Build the initial progress map. The value from the DB is the total transactions indexed so far.
  const functionProgress: { [functionName: string]: number } = {};
  for (const funcConfig of programConfig.functions) {
    functionProgress[funcConfig.name] = await getLastIndexedBlock(db, schema, programConfig.programId, funcConfig.name);
  }

  const { newFunctionProgress, mappingUpdateCandidates } = await handleProgramFunctions(
    programConfig,
    rpcUrl,
    db,
    schema,
    functionProgress
  );

  for (const funcName in newFunctionProgress) {
    const newCount = newFunctionProgress[funcName];
    const originalCount = functionProgress[funcName] || 0;
    if (newCount > originalCount) {
      await updateLastIndexedBlock(db, schema, programConfig.programId, funcName, newCount);
      logger.info({
        service: 'indexer',
        msg: `Updated progress for ${programConfig.programId}/${funcName} to ${newCount} total transactions.`,
      });
    }
  }

  if (mappingUpdateCandidates.length > 0) {
    logger.info({ service: 'indexer', msg: `Processing ${mappingUpdateCandidates.length} mapping candidates.` });
    await handleProgramMappings(
      mappingUpdateCandidates,
      allProgramConfigs,
      rpcUrl,
      db,
      schema
    );
  }
}

/**
 * Starts the main indexing loop.
 * @param config The overall IndexerConfig.
 * @param db The Drizzle DB instance (from the example project).
 * @param schema The dynamically loaded Drizzle schema (from the example project).
 */
export async function startIndexer(config: IndexerConfig, db: DbInstance, schema: GeneratedSchema) {
  // Validate environment variables (RPC_URL is now from config, DATABASE_URL is essential for DB instance)
  if (!process.env.DATABASE_URL) {
    throw new Error(`Missing required environment variable: DATABASE_URL`);
  }
  if (!config.rpcUrl) {
    throw new Error(`Missing 'rpcUrl' in indexer config.`);
  }

  logger.info({ service: 'indexer', msg: `Starting indexer for programs: ${config.programs.map(p => p.programId).join(', ')}...` });
  const limit = pLimit(parseInt(process.env.PROGRAM_CONCURRENCY_LIMIT || '10')); // Concurrency limit for processing programs

  const run = async () => {
    logger.info({ service: 'indexer', msg: 'Running indexing cycle...' });
    const tasks = config.programs.map((program) =>
      limit(() =>
        // Pass all of `config.programs` to `processProgram`
        processProgram(program, config.programs, config.rpcUrl, db, schema).catch((e) =>
          logger.error({
            service: 'indexer',
            msg: `Error processing program ${program.programId}`,
            error: e.message,
            stack: e.stack,
          })
        )
      )
    );
    await Promise.all(tasks);
    logger.info({ service: 'indexer', msg: 'Indexing cycle complete. Waiting for next cycle.' });
    setTimeout(run, parseFloat(process.env.POLLING_INTERVAL || '3000'));
  };

  await run(); // Start the first cycle immediately
}