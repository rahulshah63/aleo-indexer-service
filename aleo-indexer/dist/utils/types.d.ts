export type AleoPrimitiveType = 'address' | 'field' | 'boolean' | 'u8' | 'u16' | 'u32' | 'u64' | 'u128';
export type AleoValueType = {
    kind: 'primitive';
    type: AleoPrimitiveType;
} | {
    kind: 'record';
    recordName: string;
    fields: {
        [key: string]: AleoValueType;
    };
} | {
    kind: 'struct';
    structName: string;
    fields: {
        [key: string]: AleoValueType;
    };
} | {
    kind: 'array';
    arrayType: AleoValueType;
    length: number;
};
export interface FunctionInput {
    name: string;
    aleoType: AleoValueType;
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
export interface FunctionConfig {
    name: string;
    tableName: string;
    inputs: FunctionInput[];
    extract?: {
        [dbColumnName: string]: string;
    };
    /**
     * Optional: Specifies which mappings should be updated based on this function's execution.
     * This enables dynamic discovery of mapping keys.
     */
    triggersMappingUpdates?: MappingUpdateTrigger[];
}
export interface MappingKeyConfig {
    name: string;
    aleoType: AleoValueType;
    rpcPath?: string;
}
export interface MappingConfig {
    name: string;
    tableName: string;
    key: MappingKeyConfig;
    value: AleoValueType;
    rpcValuePath?: string;
}
export interface ProgramConfig {
    programId: string;
    functions?: FunctionConfig[];
    mappings?: MappingConfig[];
}
export interface IndexerConfig {
    rpcUrl: string;
    programs: ProgramConfig[];
}
/**
 * Helper to get a nested value from an object using a dot-separated path.
 * @param obj The object to traverse.
 * @param path The dot-separated path (e.g., "transaction.execution.transitions[0].inputs[0].value").
 * @returns The value at the specified path, or undefined if not found.
 */
export declare function getNestedValue(obj: any, path: string): any;
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
export declare function parseJSONLikeString(recordString: string): string;
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
