import { ProgramConfig, DbInstance, GeneratedSchema } from '../utils/types.js';
/**
 * Represents a request to update a specific mapping key's value,
 * originating from a processed function call.
 */
interface MappingUpdateCandidate {
    programId: string;
    mappingName: string;
    key: string;
    value?: string;
    blockHeight: number;
}
/**
 * Handles the indexing of functions defined in a program configuration.
 * Fetches transactions, parses them, and inserts into the appropriate tables.
 *
 * This function iterates through each configured function name for RPC calls
 * and collects all relevant transactions before processing them in batches.
 * It ensures sequential processing by sorting transactions and relies on Drizzle's
 * onConflictDoNothing for idempotency.
 *
 * @param programConfig The configuration for the current Aleo program.
 * @param rpcUrl The RPC URL to use for API calls.
 * @param db The Drizzle DB instance.
 * @param schema The dynamically loaded Drizzle schema.
 * @param currentPage The page number to start fetching transactions from (acts as a general progress marker).
 * @returns An object containing the next page number and a list of generated mapping update candidates.
 */
export declare function handleProgramFunctions(programConfig: ProgramConfig, rpcUrl: string, db: DbInstance, schema: GeneratedSchema, currentPage: number): Promise<{
    nextPage: number;
    mappingUpdateCandidates: MappingUpdateCandidate[];
}>;
/**
 * Handles the indexing of mappings defined in a program configuration.
 * Fetches mapping values from RPC and updates the corresponding tables,
 * primarily driven by candidates generated from function processing.
 * @param mappingUpdateCandidates A list of mapping update requests generated from function processing.
 * @param programConfigs All program configurations to find mapping definitions.
 * @param rpcUrl The RPC URL to use for API calls.
 * @param db The Drizzle DB instance.
 * @param schema The dynamically loaded Drizzle schema.
 */
export declare function handleProgramMappings(mappingUpdateCandidates: MappingUpdateCandidate[], programConfigs: ProgramConfig[], // Needs all program configs to find mapping definitions
rpcUrl: string, db: DbInstance, schema: GeneratedSchema): Promise<void>;
export {};
