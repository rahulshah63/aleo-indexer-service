// aleo-indexer/src/utils/types.ts

import { js2leo, leo2js } from "../lib/aleo/index.js";

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

// Configuration for a single output/field of a function or mapping
export interface FunctionOutput {
  name: string;
  aleoType: AleoValueType;
  // Optional: JSON path within the raw transaction where this input's value can be found.
  // If not provided, the indexer will try to infer based on common Aleo transaction structures.
  parsedPath?: string;
  rpcPath?: string;
}

/**
 * Defines how a specific function's execution should trigger an update
 * for a mapping. This allows dynamically discovering keys for mappings.
 */
export interface MappingUpdateTrigger {
  /** The program Id to get the mappings value from. */
  programId: string;
  /** The name of the mapping affected by this function. */
  mappingName: string;
  /**
   * The path within the *parsed function-specific data* where the mapping key can be found.
   * This corresponds to a column name in the function's generated database table.
   */
  keySource: string;
  /**
   * Optional: The path within the *parsed function-specific data* where the mapping value can be found.
   * If not provided, `handleProgramMappings` will fetch the value using `getMappingValue`.
   */
  valueSource?: string;
  /**
   * The Aleo type of the mapping key.
   * This is used to ensure the key is correctly parsed and stored.
   */
  aleoType: AleoValueType;
}

// Configuration for a specific Aleo function to index
export interface FunctionConfig {
  name: string; // The name of the Aleo function
  tableName: string; // The SQL table name where events from this function will be stored
  inputs?: FunctionInput[]; // The inputs to extract from this function's transitions
  outputs?: FunctionOutput[]; // The outputs to extract from this function's transitions
  // Optional: Additional fields to extract from the raw transaction that are not direct function inputs.
  // Key: desired DB column name, Value: JSON path within the raw transaction.
  extract?: { [dbColumnName: string]: string };
  /**
   * Optional: Specifies which mappings should be updated based on this function's execution.
   * This enables dynamic discovery of mapping keys.
   */
  triggersMappingUpdates?: MappingUpdateTrigger[];
}

// Configuration for a mapping's key (used in MappingConfig)
export interface MappingKeyConfig {
  name: string; // Name of the key field
  aleoType: AleoValueType; // Aleo type of the key
  // Optional: JSON path within the `finalize` entry to get the key's value.
  // If not provided, defaults to 'key_id'.
  rpcPath?: string;
}

// Configuration for a specific Aleo mapping to index
export interface MappingConfig {
  name: string; // The name of the Aleo mapping
  tableName: string; // The SQL table name where the state of this mapping will be stored
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
  rpcUrl: string; // The Aleo RPC URL to get transactions from
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
    if (part.includes('[')) {
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
export function parseJSONLikeString(recordString: string) {
  const json = recordString.replace(/(['"])?([a-z0-9A-Z_.]+)(['"])?/g, '"$2" ');
  const correctJson = json;
  return JSON.parse(correctJson);
}

export interface DbInstance {
  insert: any;
  select: any;
  update: any;
  delete: any;
}

export interface GeneratedSchema {
  transactions: any;
  indexerState: any;
  [key: string]: any;
}

/**
 * Recursively parses a JSON object or array containing Leo-typed string literals.
 *
 * - If the input is an array, each element is parsed recursively.
 * - If the input is an object, each property value is parsed recursively.
 * - If the input is a string, it is parsed using `parseLeoLiteralString`.
 * - Otherwise, the input is returned as-is.
 *
 * @param data - The JSON data to parse, which may contain Leo-typed string literals.
 * @returns The parsed data with Leo-typed strings converted to their corresponding values.
 */
export function parseLeoTypedJSON(data: any): any {
  if (Array.isArray(data)) {
    return data.map(item => parseLeoTypedJSON(item));
  }

  if (typeof data === 'object' && data !== null) {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = parseLeoTypedJSON(value);
    }
    return result;
  }

  if (typeof data === 'string') {
    return parseLeoLiteralString(data);
  }

  return data;
}

type Leo2JsType = 'u8' | 'u16' | 'u32' | 'u64' | 'u128' | 'field' | 'address' | 'boolean';
const supportedLeoType = ['u8', 'u16', 'u32', 'u64', 'u128', 'field', 'address', 'boolean'];

/**
 * Parses a Leo literal string and returns its corresponding JavaScript value.
 *
 * - If the input is 'true' or 'false', returns the boolean value.
 * - If the input matches a numeric literal with a type suffix (e.g., '123u32', '456field'),
 *   it uses the appropriate parser from the `leo2js` mapping to convert the value.
 * - If the input does not match any known pattern, returns the raw string.
 *
 * @param value - The Leo literal string to parse.
 * @returns The parsed JavaScript value (boolean, number, or string).
 * @throws {Error} If the type suffix is unsupported.
 */
function parseLeoLiteralString(value: string) {
  if (value === 'true') return true;
  if (value === 'false') return false;

  const match = value.split('.')[0].match(/^(\d+)(u\d+|field)$/);
  if (match) {
    const [_, numStr, type] = match;
    // Type guard to ensure type is a valid Leo2JsType
    if ((supportedLeoType).includes(type)) {
      const parser = leo2js[type as Leo2JsType];
      const data = parser(numStr)
      return typeof data === "boolean" ? data : data.toString(); // Convert to string for db storage
    } else {
      throw new Error(`Unsupported Leo type: ${type}`);
    }
  }

  return value; // Return raw string if not a typed literal
}

/**
 * Converts a JavaScript value to its corresponding Leo string representation based on the provided type.
 *
 * @param value - The JavaScript value to convert.
 * @param type - The target Leo type to convert the value to. If undefined, the original value is returned.
 * @returns The value converted to a Leo-compatible string, or the original value if no type is provided.
 * @throws {Error} If the provided Leo type is unsupported.
 */
export function JS2Leo(value: string, type: Leo2JsType | undefined): string {
  if(!type) {
    return value; // If no type is provided, return the value as is
  }
  const parser = js2leo[type] as (T: any) => string;
  if (!parser) {
    throw new Error(`Unsupported Leo type: ${type}`);
  }
  return parser(value).toString();
}