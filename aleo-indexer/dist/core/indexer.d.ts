import { IndexerConfig, DbInstance, GeneratedSchema } from '../utils/types.js';
/**
 * Starts the main indexing loop.
 * @param config The overall IndexerConfig.
 * @param db The Drizzle DB instance (from the example project).
 * @param schema The dynamically loaded Drizzle schema (from the example project).
 */
export declare function startIndexer(config: IndexerConfig, db: DbInstance, schema: GeneratedSchema): Promise<void>;
