import { IndexerConfig } from '../utils/types.js';
/**
 * Generates both Drizzle and GraphQL schemas based on the provided IndexerConfig.
 * @param config The IndexerConfig.
 */
export declare function generateSchemas(config: IndexerConfig): Promise<void>;
