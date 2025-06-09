import { db } from "../database/db.js";
import { logger } from "../internal/logger.js"; 
import { ProgramConfig, ProgramFunctionConfig } from "../config/program.js";
import { tables } from "../database/schema.js";
import asyncRetry from 'async-retry';

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

async function callRpc<T>(method: string, params: unknown): Promise<RpcResponse<T>> {
  return asyncRetry(async bail => {
    try {
      const response = await fetch(
        process.env.RPC_URL!,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: method,
            params: params,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        if (data.error.code === -32602) {
          bail(new Error(`RPC permanent error: ${data.error.message}`));
        }
        throw new Error(data.error.message);
      }

      return data.result;
    } catch (error: any) {
      const errorMessage = error.response
        ? `HTTP Error: ${error.response.status} - ${error.response.statusText}. RPC Response: ${JSON.stringify(error.response.data)}`
        : error.message;

      logger.warn({
        service: "rpc",
        msg: `RPC call '${method}' failed`,
        error: errorMessage,
      });
      throw error; 
    }
  }, {
    retries: 5,
    minTimeout: 1000,
    maxTimeout: 60000,
    factor: 2,
    onRetry: (error: Error | any, attempt) => {
      logger.info({
        service: "rpc",
        msg: `Retrying RPC call '${method}' (attempt ${attempt}) due to error: ${error.message}`,
      });
    }
  });
}

// This function will now handle any program configuration
export async function handleProgramEvents(
  programConfig: ProgramConfig,
  startPage: number
): Promise<number> {
  const BATCH_SIZE = 50;
  let currentPage = startPage;

  try {
    for (const funcConfig of programConfig.functions) {
      // 1. Fetch raw transaction data dynamically using the correct RPC method and programName
      const transactions = await callRpc<any[]>("aleoTransactionsForProgram", {
        programName: programConfig.programName,
        functionName: funcConfig.name,
        page: currentPage,
        maxTransactions: BATCH_SIZE,
      });

      if (!transactions || transactions.length === 0) {
        // If no transactions for this function, continue to the next function or return
        continue;
      }

      // 2. Dynamic Parsing and Transformation
      const valuesToInsert = transactions.map((tx) => {
        const mappedData: { [key: string]: any } = {};
        mappedData.transactionId = tx.transaction?.id;
        mappedData.blockHeight = tx.block_height;

        for (const rpcField in funcConfig.fields) {
            const dbField = funcConfig.fields[rpcField];
            // This part needs careful adaptation based on the actual RPC response structure
            // For example, if rpcField is 'transaction.id' and dbField is 'id'
            // you'd need logic to navigate the `tx` object:
            // if (rpcField.includes('.')) {
            //   const parts = rpcField.split('.');
            //   let current = tx;
            //   for (const part of parts) {
            //     if (current && typeof current === 'object' && part in current) {
            //       current = current[part];
            //     } else {
            //       current = undefined; // Path not found
            //       break;
            //     }
            //   }
            //   mappedData[dbField] = current;
            // } else {
            //   mappedData[dbField] = tx[rpcField];
            // }

            mappedData[dbField] = tx[rpcField]; // This line might need complex parsing
        }


        mappedData.programName = programConfig.programName;
        mappedData.functionName = funcConfig.name;
        mappedData.timestamp = tx.finalizedAt ? new Date(parseInt(tx.finalizedAt) * 1000) : new Date(); // Convert Unix timestamp to Date
        return mappedData;
      });

      // 3. Dynamic Database Storage
      const targetTable = (tables as any)[funcConfig.tableName];

      if (!targetTable) {
        logger.error({
          service: "parser",
          msg: `Database table '${funcConfig.tableName}' not found for program '${programConfig.programName}' function '${funcConfig.name}'`,
        });
        continue;
      }

      await db
        .insert(targetTable)
        .values(valuesToInsert)
        .onConflictDoNothing({ target: (targetTable as any).id });

      logger.info({
        service: "parser",
        msg: `Indexed ${valuesToInsert.length} transactions for program '${programConfig.programName}' function '${funcConfig.name}' on page ${currentPage}`,
      });
    }

    return currentPage + 1;
  } catch (error: Error | any) {
    logger.error({service: "parser", msg: `Error processing program '${programConfig.programName}' on page ${currentPage}`, error}
    );
    return currentPage;
  }
}