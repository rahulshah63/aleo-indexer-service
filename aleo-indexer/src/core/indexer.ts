// aleo-indexer/src/core/indexer.ts

import { ProgramConfig, IndexerConfig, DbInstance, GeneratedSchema } from '../utils/types.js';
import { logger } from '../utils/logger.js';
import { handleProgramFunctions, handleProgramMappings } from './processor.js';
import pLimit from 'p-limit'; // For concurrency control
import { eq } from 'drizzle-orm';

/**
 * Retrieves the last indexed block height for a given program from the database.
 * @param db The Drizzle DB instance.
 * @param schema The dynamically loaded Drizzle schema, specifically `indexerState` table.
 * @param programName The full program ID (e.g., "token_registry.aleo").
 * @returns The last indexed block height, or 0 if not found.
 */
async function getLastIndexedBlock(db: DbInstance, schema: GeneratedSchema, programName: string): Promise<number> {
  const result = await db
    .select({ lastIndexedBlock: schema.indexerState.lastIndexedBlock })
    .from(schema.indexerState)
    .where(eq(schema.indexerState.programName, programName));

  return result.length > 0 ? result[0].lastIndexedBlock : 0;
}

/**
 * Updates the last indexed block height for a given program in the database.
 * @param db The Drizzle DB instance.
 * @param schema The dynamically loaded Drizzle schema, specifically `indexerState` table.
 * @param programName The full program ID.
 * @param blockHeight The new last indexed block height.
 */
async function updateLastIndexedBlock(db: DbInstance, schema: GeneratedSchema, programName: string, blockHeight: number) {
  await db
    .insert(schema.indexerState)
    .values({ programName, lastIndexedBlock: blockHeight, lastUpdated: new Date() })
    .onConflictDoUpdate({
      target: schema.indexerState.programName,
      set: { lastIndexedBlock: blockHeight, lastUpdated: new Date() },
    });
}

/**
 * Processes a single Aleo program by handling its functions and mappings.
 * @param programConfig The configuration for the program.
 * @param allProgramConfigs All program configurations for the current indexing cycle. (NEW)
 * @param rpcUrl The RPC URL to use.
 * @param db The Drizzle DB instance.
 * @param schema The dynamically loaded Drizzle schema.
 */
async function processProgram(
  programConfig: ProgramConfig,
  allProgramConfigs: ProgramConfig[], // Added to pass to handleProgramMappings
  rpcUrl: string,
  db: DbInstance,
  schema: GeneratedSchema
) {
  // Use programConfig.programId for state tracking
  const lastIndexedBlock = await getLastIndexedBlock(db, schema, programConfig.programId);
  logger.info({
    service: 'indexer',
    msg: `Processing program ${programConfig.programId} starting from page ${lastIndexedBlock}`, // Changed to page for clarity
  });

  // Handle functions (transactions)
  // handleProgramFunctions now returns both the next page and mapping update candidates
  const { nextPage: nextFunctionPage, mappingUpdateCandidates } = await handleProgramFunctions(
    programConfig,
    rpcUrl,
    db,
    schema,
    9
  );

  // Update last indexed block for functions based on actual transactions processed if possible,
  // otherwise, rely on the page number as a proxy for progress.
  // Note: `aleoTransactionsForProgram` takes a `page` parameter, so `nextFunctionPage` is the next page to fetch.
  // It indicates progress, even if it's not a direct block height.
  if (nextFunctionPage > lastIndexedBlock) {
    await updateLastIndexedBlock(db, schema, programConfig.programId, nextFunctionPage);
    logger.info({
      service: 'indexer',
      msg: `Program ${programConfig.programId} functions indexed up to page ${nextFunctionPage - 1}. Next page to process: ${nextFunctionPage}.`,
    });
  } else {
    logger.info({
      service: 'indexer',
      msg: `Program ${programConfig.programId} functions: No new transactions processed on page ${lastIndexedBlock}.`,
    });
  }


  // Handle mappings (updates based on recent finalized transactions AND function triggers)
  // Pass the collected mappingUpdateCandidates
  await handleProgramMappings(
    mappingUpdateCandidates, // Pass candidates from handleProgramFunctions
    allProgramConfigs,       // Pass all program configs so handleProgramMappings can resolve mapping definitions
    rpcUrl,
    db,
    schema
  );
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
  const limit = pLimit(5); // Concurrency limit for processing programs

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
    setTimeout(run, 30000); // Run every 30 seconds
  };

  await run(); // Start the first cycle immediately
}