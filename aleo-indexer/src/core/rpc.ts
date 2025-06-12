// aleo-indexer/src/core/rpc.ts

import asyncRetry from 'async-retry';
import { logger } from '../utils/logger.js';

// Define types for Aleo RPC responses
interface RpcResponse<T> {
  jsonrpc: string;
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

/**
 * Generic function to make RPC calls to the Aleo network.
 * Includes retry logic and error handling.
 * @param rpcUrl The URL of the Aleo RPC endpoint.
 * @param method The RPC method to call (e.g., "aleoTransactionsForProgram", "getMappingValue").
 * @param params The parameters for the RPC method.
 * @returns The result of the RPC call.
 */
export async function callRpc<T>(
  rpcUrl: string, // Now takes rpcUrl as a parameter
  method: string,
  params: unknown
): Promise<T> { // Promise<T> directly, let the caller handle RpcResponse structure if needed.
  return asyncRetry(
    async (bail) => {
      try {
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1, // might want to make this dynamic if making multiple concurrent calls
            method: method,
            params: params,
          }),
        });

        if (!response.ok) {
          throw new Error(
            `HTTP Error: ${response.status} - ${response.statusText}`
          );
        }

        const data: RpcResponse<T> = await response.json();
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
          return undefined as T; // Type assertion to allow undefined for T
        }

        return data.result;
      } catch (error: any) {
        const errorMessage = error.response
          ? `HTTP Error: ${error.response.status} - ${
              error.response.statusText
            }. RPC Response: ${JSON.stringify(error.response.data)}`
          : error.message;

        logger.warn({
          service: 'rpc',
          msg: `RPC call '${method}' to ${rpcUrl} failed`,
          error: errorMessage,
        });
        throw error;
      }
    },
    {
      retries: 5, // Number of retries before giving up
      minTimeout: 1000, // Initial delay before first retry
      maxTimeout: 60000, // Maximum delay between retries
      factor: 2, // Factor by which to increase the retry delay
      onRetry: (error: Error | any, attempt) => {
        logger.info({
          service: 'rpc',
          msg: `Retrying RPC call '${method}' (attempt ${attempt}) due to error: ${error.message}`,
        });
      },
    }
  );
}

// Define the structure of an Aleo transaction as returned by RPC
export interface AleoTransaction {
  status: 'accepted' | 'rejected' | 'finalized';
  type: 'execute';
  transaction: {
    type: string;
    id: string; // transaction_id
    execution?: { // execution block is optional
      transitions: {
        id: string;
        program: string;
        function: string;
        inputs: {
          type: 'public' | 'private' | 'record';
          id: string; // e.g., 'input_record'
          value?: string; // The raw value (e.g., 'address', 'u128', or serialized record string)
          tag?: string;
        }[];
        outputs: {
          type: string;
          id: string;
          checksum?: string;
          value: string;
        }[];
        tpk: string;
        tcm: string;
      }[];
      global_state_root: string;
      proof: string;
    };
    fee?: { // fee block is optional
      transition: {
        id: string;
        program: string;
        function: string;
        inputs: {
          type: 'public' | 'private';
          id: string;
          value: string;
        }[];
        outputs: {
          type: string;
          id: string;
          value: string;
        }[];
        tpk: string;
        tcm: string;
      };
      global_state_root: string;
      proof: string;
    };
  };
  finalize?: { // finalize block is optional
    type: string;
    mapping_id: string;
    index: number;
    key_id: string;
    value_id: string;
  }[];
  finalizedAt?: string; // Timestamp when finalized (as string, convert to number)
}

// Interface for mapping value returned by RPC
export interface AleoMappingValue {
  type: string;
  id: string; // The ID representing the value
  value: string; // The actual value string (e.g., 'u128.private', 'record.private')
}