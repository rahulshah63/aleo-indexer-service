// aleo-indexer/src/utils/types.ts
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
//# sourceMappingURL=types.js.map