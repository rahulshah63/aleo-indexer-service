// aleo-indexer/src/utils/types.ts
import { js2leo, leo2js } from "../lib/aleo/index.js";
/**
 * Helper to get a nested value from an object using a dot-separated path.
 * @param obj The object to traverse.
 * @param path The dot-separated path (e.g., "transaction.execution.transitions[0].inputs[0].value").
 * @returns The value at the specified path, or undefined if not found.
 */
export function getNestedValue(obj, path) {
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
        }
        else {
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
export function parseJSONLikeString(recordString) {
    const json = recordString.replace(/(['"])?([a-z0-9A-Z_.]+)(['"])?/g, '"$2" ');
    const correctJson = json;
    return JSON.parse(correctJson);
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
export function parseLeoTypedJSON(data) {
    if (Array.isArray(data)) {
        return data.map(item => parseLeoTypedJSON(item));
    }
    if (typeof data === 'object' && data !== null) {
        const result = {};
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
function parseLeoLiteralString(value) {
    if (value === 'true')
        return true;
    if (value === 'false')
        return false;
    const match = value.split('.')[0].match(/^(\d+)(u\d+|field)$/);
    if (match) {
        const [_, numStr, type] = match;
        // Type guard to ensure type is a valid Leo2JsType
        if ((supportedLeoType).includes(type)) {
            const parser = leo2js[type];
            const data = parser(numStr);
            return typeof data === "boolean" ? data : data.toString(); // Convert to string for db storage
        }
        else {
            throw new Error(`Unsupported Leo type: ${type}`);
        }
    }
    return value; // Return raw string if not a typed literal
}
export function JS2Leo(value, type) {
    if (!type) {
        return value; // If no type is provided, return the value as is
    }
    const parser = js2leo[type];
    if (!parser) {
        throw new Error(`Unsupported Leo type: ${type}`);
    }
    return parser(value).toString();
}
//# sourceMappingURL=types.js.map