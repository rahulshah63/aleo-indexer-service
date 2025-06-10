/**
 * Generic function to make RPC calls to the Aleo network.
 * Includes retry logic and error handling.
 * @param rpcUrl The URL of the Aleo RPC endpoint.
 * @param method The RPC method to call (e.g., "aleoTransactionsForProgram", "getMappingValue").
 * @param params The parameters for the RPC method.
 * @returns The result of the RPC call.
 */
export declare function callRpc<T>(rpcUrl: string, // Now takes rpcUrl as a parameter
method: string, params: unknown): Promise<T>;
export interface AleoTransaction {
    status: 'accepted' | 'rejected' | 'finalized';
    type: string;
    transaction: {
        type: string;
        id: string;
        execution?: {
            transitions: {
                id: string;
                program: string;
                function: string;
                inputs: {
                    type: 'public' | 'private' | 'record';
                    id: string;
                    value?: string;
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
        fee?: {
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
    finalize?: {
        type: string;
        mapping_id: string;
        index: number;
        key_id: string;
        value_id: string;
    }[];
    finalizedAt?: string;
}
export interface AleoMappingValue {
    type: string;
    id: string;
    value: string;
}
