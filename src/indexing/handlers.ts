import { callRpc } from "../utils/rpc.js";
import { db } from "../database/db.js";
import { logger } from "../internal/logger.js";
import { ProgramConfig, ProgramFunctionConfig } from "../config/program.js";
import { tables } from "../database/schema.js"; // Ensure 'tables' is dynamically accessible or flexible

// A mock RPC call function
async function callRpc<T>(method: string, params: unknown): Promise<T> {
  const response = await fetch(process.env.RPC_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.result;
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
      // 1. Fetch raw transaction data dynamically
      const transactions = await callRpc<any[]>("transactionsForProgram", {
        programId: programConfig.id,
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
        for (const rpcField in funcConfig.fields) {
          const dbField = funcConfig.fields[rpcField];
          mappedData[dbField] = tx[rpcField];
        }
        // Add common fields not necessarily from RPC response directly, or adjust config
        mappedData.programId = programConfig.id;
        mappedData.functionName = funcConfig.name;
        mappedData.timestamp = new Date(); // Or parse from tx if available
        return mappedData;
      });

      // 3. Dynamic Database Storage
      // This is the trickiest part: `tables` needs to be dynamic.
      // You'd need a way to get the correct Drizzle table based on `funcConfig.tableName`.
      // This likely requires generating Drizzle schemas dynamically or having a comprehensive
      // `tables` object that can be indexed by string.
      const targetTable = (tables as any)[funcConfig.tableName]; // Type assertion for dynamic access

      if (!targetTable) {
        logger.error({
          service: "parser",
          msg: `Database table '${funcConfig.tableName}' not found for program '${programConfig.id}' function '${funcConfig.name}'`,
        });
        continue;
      }

      await db
        .insert(targetTable)
        .values(valuesToInsert)
        .onConflictDoNothing({ target: (targetTable as any).id }); // Assuming 'id' is always the conflict target

      logger.info({
        service: "parser",
        msg: `Indexed ${valuesToInsert.length} transactions for program '${programConfig.id}' function '${funcConfig.name}' on page ${currentPage}`,
      });
    }

    // Return the next page number for the entire program
    return currentPage + 1;
  } catch (error: Error | any) {
    logger.error({service: "parser", msg: `Error processing program '${programConfig.id}' on page ${currentPage}`, error}
    );
    return currentPage; // Return current page to retry
  }
}
