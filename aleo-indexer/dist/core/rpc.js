// aleo-indexer/src/core/rpc.ts
import asyncRetry from 'async-retry';
import { logger } from '../utils/logger.js';
/**
 * Generic function to make RPC calls to the Aleo network.
 * Includes retry logic and error handling.
 * @param rpcUrl The URL of the Aleo RPC endpoint.
 * @param method The RPC method to call (e.g., "aleoTransactionsForProgram", "getMappingValue").
 * @param params The parameters for the RPC method.
 * @returns The result of the RPC call.
 */
export async function callRpc(rpcUrl, // Now takes rpcUrl as a parameter
method, params) {
    return asyncRetry(async (bail) => {
        try {
            const response = await fetch(rpcUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1, // You might want to make this dynamic if making multiple concurrent calls
                    method: method,
                    params: params,
                }),
            });
            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
            }
            const data = await response.json();
            if (data.error) {
                // Permanent errors (e.g., invalid parameters) should not be retried
                if (data.error.code === -32602) {
                    bail(new Error(`RPC permanent error: ${data.error.message}`));
                }
                throw new Error(data.error.message);
            }
            if (data.result === undefined) {
                // This can happen if the RPC call returns a successful response but with a null/undefined result
                // which might indicate no data found for the query (e.g., no transactions on a page).
                // Treat as success with no data, or throw if result is expected.
                // For now, let's return undefined if result is absent but no error.
                return undefined; // Type assertion to allow undefined for T
            }
            return data.result;
        }
        catch (error) {
            const errorMessage = error.response
                ? `HTTP Error: ${error.response.status} - ${error.response.statusText}. RPC Response: ${JSON.stringify(error.response.data)}`
                : error.message;
            logger.warn({
                service: 'rpc',
                msg: `RPC call '${method}' to ${rpcUrl} failed`,
                error: errorMessage,
            });
            throw error;
        }
    }, {
        retries: 5, // Number of retries before giving up
        minTimeout: 1000, // Initial delay before first retry
        maxTimeout: 60000, // Maximum delay between retries
        factor: 2, // Factor by which to increase the retry delay
        onRetry: (error, attempt) => {
            logger.info({
                service: 'rpc',
                msg: `Retrying RPC call '${method}' (attempt ${attempt}) due to error: ${error.message}`,
            });
        },
    });
}
//# sourceMappingURL=rpc.js.map