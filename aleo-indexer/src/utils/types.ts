// aleo-indexer/src/utils/types.ts

// Define primitive Aleo types
export type AleoPrimitiveType =
  | 'address'
  | 'field'
  | 'boolean'
  | 'u8'
  | 'u16'
  | 'u32'
  | 'u64'
  | 'u128';

// Define complex Aleo types
export type AleoValueType =
  | { kind: 'primitive'; type: AleoPrimitiveType }
  | { kind: 'record'; recordName: string; fields: { [key: string]: AleoValueType } }
  | { kind: 'struct'; structName: string; fields: { [key: string]: AleoValueType } }
  | { kind: 'array'; arrayType: AleoValueType; length: number }; // Example for arrays


// Configuration for a single input/field of a function or mapping
export interface FunctionInput {
  name: string;
  aleoType: AleoValueType;
  // Optional: JSON path within the raw transaction where this input's value can be found.
  // If not provided, the indexer will try to infer based on common Aleo transaction structures.
  rpcPath?: string;
}

/**
 * Defines how a specific function's execution should trigger an update
 * for a mapping. This allows dynamically discovering keys for mappings.
 */
export interface MappingUpdateTrigger {
  /** The name of the mapping affected by this function (e.g., 'account_balances'). */
  mappingName: string;
  /**
   * The path within the *parsed function-specific data* where the mapping key can be found.
   * This corresponds to a column name in the function's generated database table.
   * Example: 'sender', 'receiver', 'token_id'.
   */
  keySource: string;
  /**
   * Optional: The path within the *parsed function-specific data* where the mapping value can be found.
   * If not provided, `handleProgramMappings` will fetch the value using `getMappingValue`.
   * This is useful if the function's output directly updates the mapping value (e.g., a new balance).
   */
  valueSource?: string;
}

// Configuration for a specific Aleo function to index
export interface FunctionConfig {
  name: string; // The name of the Aleo function (e.g., "transfer_public")
  tableName: string; // The SQL table name where events from this function will be stored (e.g., "public_transfers")
  inputs: FunctionInput[]; // The inputs to extract from this function's transitions
  // Optional: Additional fields to extract from the raw transaction that are not direct function inputs.
  // Key: desired DB column name, Value: JSON path within the raw transaction.
  extract?: { [dbColumnName: string]: string };
  /**
   * Optional: Specifies which mappings should be updated based on this function's execution.
   * This enables dynamic discovery of mapping keys.
   */
  triggersMappingUpdates?: MappingUpdateTrigger[]; // <--- NEW PROPERTY
}

// Configuration for a mapping's key (used in MappingConfig)
export interface MappingKeyConfig {
  name: string; // Name of the key field (e.g., "account_address")
  aleoType: AleoValueType; // Aleo type of the key
  // Optional: JSON path within the `finalize` entry to get the key's value.
  // If not provided, defaults to 'key_id'.
  rpcPath?: string;
}

// Configuration for a specific Aleo mapping to index
export interface MappingConfig {
  name: string; // The name of the Aleo mapping (e.g., "account_balances")
  tableName: string; // The SQL table name where the state of this mapping will be stored (e.g., "balances_map")
  key: MappingKeyConfig; // Configuration for the mapping's key
  value: AleoValueType; // Configuration for the mapping's value type
  // Optional: JSON path within the `finalize` entry to get the value's value.
  // If not provided, defaults to 'value_id'.
  rpcValuePath?: string;
}

// Configuration for an Aleo program to index
export interface ProgramConfig {
  programId: string; // The full Aleo program ID (e.g., "token_registry.aleo")
  functions?: FunctionConfig[]; // Array of functions to index within this program
  mappings?: MappingConfig[]; // Array of mappings to index within this program
}

// Overall indexer configuration
export interface IndexerConfig {
  rpcUrl: string; // The Aleo RPC URL to connect to
  programs: ProgramConfig[]; // Array of programs to index
}

/**
 * Helper to get a nested value from an object using a dot-separated path.
 * @param obj The object to traverse.
 * @param path The dot-separated path (e.g., "transaction.execution.transitions[0].inputs[0].value").
 * @returns The value at the specified path, or undefined if not found.
 */
export function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) {
    return undefined;
  }
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (part.includes('[')) { // Handle array indexing
      const arrayPart = part.substring(0, part.indexOf('['));
      const index = parseInt(part.substring(part.indexOf('[') + 1, part.indexOf(']')));
      if (!current[arrayPart] || !Array.isArray(current[arrayPart]) || current[arrayPart].length <= index) {
        return undefined;
      }
      current = current[arrayPart][index];
    } else {
      if (typeof current !== 'object' || current === null || !(part in current)) {
        return undefined;
      }
      current = current[part];
    }
  }
  return current;
}

/**
 * Parses a string that resembles JSON and attempts to convert it into a valid JSON object.
 * 
 * This function replaces unquoted property names in the input string with quoted ones,
 * making it compatible with `JSON.parse`. It is useful for handling objects that are
 * not strictly valid JSON but are close in structure.
 *
 * @param recordString - The string that looks like a JSON object but may have unquoted property names.
 * @returns The parsed JSON object.
 * @throws {SyntaxError} If the resulting string is not valid JSON.
 */
export function parseJSONLikeString(recordString: string): string {
  const json = recordString.replace(/(['"])?([a-z0-9A-Z_.]+)(['"])?/g, '"$2" ');
  const correctJson = json;
  return JSON.parse(correctJson);
}

// Define a placeholder for the Drizzle instance and the generated schema tables
// These will be passed dynamically from the `startIndexer` function
export interface DbInstance {
  insert: any; // Simplified for now, replace with actual Drizzle `insert` return type
  select: any;
  update: any;
  delete: any;
}

export interface GeneratedSchema {
  transactions: any;
  indexerState: any;
  [key: string]: any; // Allow dynamic access to other generated tables (functions, mappings)
}
