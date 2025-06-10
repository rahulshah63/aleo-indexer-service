import { db } from "../database/db.js";
import { logger } from "../internal/logger.js";
import { getNestedValue, ProgramConfig } from "../internal/types.js";
import { tables } from "../database/schema.js";
import asyncRetry from "async-retry";

interface AleoTransaction {
  status: "accepted" | "rejected" | "finalized";
  type: string;
  transaction: {
    type: string;
    id: string;
    execution: {
      transitions: {
        id: string;
        program: string;
        function: string;
        inputs: {
          type: "public" | "private" | "record";
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
    fee: {
      transition: {
        id: string;
        program: string;
        function: string;
        inputs: {
          type: "public" | "private";
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
  finalize: [
    {
      type: string;
      mapping_id: string;
      index: number;
      key_id: string;
      value_id: string;
    }
  ];
  finalizedAt?: string;
}

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

async function callRpc<T>(
  method: string,
  params: unknown
): Promise<RpcResponse<T>> {
  return asyncRetry(
    async (bail) => {
      try {
        const response = await fetch(process.env.RPC_URL!, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: method,
            params: params,
          }),
        });

        if (!response.ok) {
          throw new Error(
            `HTTP Error: ${response.status} - ${response.statusText}`
          );
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
          ? `HTTP Error: ${error.response.status} - ${
              error.response.statusText
            }. RPC Response: ${JSON.stringify(error.response.data)}`
          : error.message;

        logger.warn({
          service: "rpc",
          msg: `RPC call '${method}' failed`,
          error: errorMessage,
        });
        throw error;
      }
    },
    {
      retries: 5,
      minTimeout: 1000,
      maxTimeout: 60000,
      factor: 2,
      onRetry: (error: Error | any, attempt) => {
        logger.info({
          service: "rpc",
          msg: `Retrying RPC call '${method}' (attempt ${attempt}) due to error: ${error.message}`,
        });
      },
    }
  );
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
      // 1. Fetch raw transaction data
      const response = await callRpc<[AleoTransaction]>( //need to check if it can be T[];
        "aleoTransactionsForProgram",
        {
          programName: programConfig.programName,
          functionName: funcConfig.name,
          page: currentPage,
          maxTransactions: BATCH_SIZE,
        }
      );

      // Validate the RPC response
      if (!response || response.error || !response.result) {
        logger.info({
          service: "parser",
          msg: `No new transactions for ${programConfig.programName}/${funcConfig.name} on page ${currentPage}.`,
        });
        continue;
      }

      const transactions = response.result.filter(
        (tx) => tx.status === "finalized"
      );

      if (transactions.length === 0) {
        continue;
      }

      // 2. Dynamic Parsing and Transformation
      const valuesToInsert = transactions.map((tx) => {
        // Dynamically map fields from config
        const dynamicFields: { [key: string]: any } = {};
        for (const rpcField in funcConfig.fields) {
          const dbField = funcConfig.fields[rpcField];
          // Use the helper to safely access nested properties
          const value = getNestedValue(tx, rpcField);
          if (value !== undefined) {
            dynamicFields[dbField] = value;
          }
        }

        return {
          programName: programConfig.programName,
          functionName: funcConfig.name,
          transactionId: tx.transaction.id,
          blockHeight: "1", //@todo: change to tx.block_height;
          timestamp: tx.finalizedAt
            ? new Date(parseInt(tx.finalizedAt) * 1000)
            : new Date(),
          data: dynamicFields,
        };
      });

      // 3. Dynamic Database Storage
      const targetTable = tables.transactions;

      await db
        .insert(targetTable)
        .values(valuesToInsert)
        .onConflictDoNothing({ target: targetTable.transactionId });

      logger.info({
        service: "parser",
        msg: `Indexed ${valuesToInsert.length} transactions for program '${programConfig.programName}' function '${funcConfig.name}' on page ${currentPage}`,
      });

      // 4. Update Reserve and User Data derived from these transactions
      for (const tx of transactions) {
        // Example: Extract caller and tokenId from the transaction inputs
        // This logic is highly dependent on your program's function signatures
        const caller =
          tx.transaction?.execution?.transitions?.[0]?.inputs?.[0]?.value;
        const tokenId =
          tx.transaction?.execution?.transitions?.[0]?.inputs?.[1]?.value; // Example: assuming token_id is the second input

        if (tokenId) {
          await updateReserveData(tokenId);
          if (caller) {
            await updateUserData(caller, [tokenId]);
          }
        }
      }
    }

    return currentPage + 1;
  } catch (error: Error | any) {
    logger.error({
      service: "parser",
      msg: `Error processing program '${programConfig.programName}' on page ${currentPage}`,
      error: error.message,
    });
    return currentPage; // Return current page on error to retry later
  }
}

// Function to update reserve-specific data
async function updateReserveData(tokenId: string) {
  try {
    // 1. Fetch all reserve-related data from RPC
    const [
      reserveDataResult,
      reserveConfigResult,
      totalBorrowedResult,
      totalDepositedResult,
      totalAvailableLiquidityResult,
    ] = await Promise.all([
      callRpc<any>("getMappingValue", {
        programId: "Amm_reserve_state.aleo",
        mappingName: "reserve_data",
        key: tokenId,
      }),
      callRpc<any>("getMappingValue", {
        programId: "Amm_reserve_state.aleo",
        mappingName: "reserve_config",
        key: tokenId,
      }),
      callRpc<any>("getMappingValue", {
        programId: "Amm_reserve_state.aleo",
        mappingName: "total_borrowed_amount",
        key: tokenId,
      }),
      callRpc<any>("getMappingValue", {
        programId: "Amm_reserve_state.aleo",
        mappingName: "total_deposited_amount",
        key: tokenId,
      }),
      callRpc<any>("getMappingValue", {
        programId: "Amm_reserve_state.aleo",
        mappingName: "total_available_liquidity",
        key: tokenId,
      }),
    ]);

    // 2. Parse and update the 'reserveData' and 'reserveConfig' tables
    if (reserveDataResult && reserveConfigResult) {
      // Assuming parsing logic here to extract fields from results
      const parsedReserveData = {
        id: tokenId,
        // ... other fields from reserveDataResult
        totalBorrowedAmount: totalBorrowedResult,
        totalDepositedAmount: totalDepositedResult,
        totalAvailableLiquidity: totalAvailableLiquidityResult,
      };

      const parsedReserveConfig = {
        id: tokenId,
        // ... other fields from reserveConfigResult
      };

      await db
        .insert(tables.reserveData)
        .values(parsedReserveData)
        .onConflictDoUpdate({
          target: tables.reserveData.id,
          set: parsedReserveData,
        });

      await db
        .insert(tables.reserveConfig)
        .values(parsedReserveConfig)
        .onConflictDoUpdate({
          target: tables.reserveConfig.id,
          set: parsedReserveConfig,
        });

      logger.info({
        service: "parser",
        msg: `Updated reserve data for token ${tokenId}`,
      });
    }
  } catch (error: Error | any) {
    logger.error({
      service: "parser",
      msg: `Failed to update reserve data for token ${tokenId}:`,
      error: error.message,
    });
  }
}

// Function to update user-specific data
async function updateUserData(userAddress: string, reserveIds: string[]) {
  try {
    // 1. Fetch user data from RPC
    const userDataResult = await callRpc<any>("getMappingValue", {
      programId: "Amm_user_state.aleo",
      mappingName: "usersdata",
      key: userAddress,
    });

    if (userDataResult) {
      // Assuming parsing logic for userDataResult
      const parsedUserData = {
        id: userAddress,
        // ... other fields from userDataResult
      };

      await db
        .insert(tables.userData)
        .values(parsedUserData)
        .onConflictDoUpdate({
          target: tables.userData.id,
          set: parsedUserData,
        });

      // 2. Fetch user-reserve specific data for each reserve
      for (const reserveId of reserveIds) {
        const userReserveKey = `${userAddress}_${reserveId}`; // Construct the key as needed
        const [
          borrowedAmountResult,
          depositedAmountResult,
          userCumulativeIndexResult,
        ] = await Promise.all([
          callRpc<any>("getMappingValue", {
            programId: "Amm_reserve_state.aleo",
            mappingName: "borrowed_amount",
            key: userReserveKey,
          }),
          callRpc<any>("getMappingValue", {
            programId: "Amm_reserve_state.aleo",
            mappingName: "deposited_amount",
            key: userReserveKey,
          }),
          callRpc<any>("getMappingValue", {
            programId: "Amm_reserve_state.aleo",
            mappingName: "user_cumulative_index",
            key: userReserveKey,
          }),
        ]);

        if (borrowedAmountResult && depositedAmountResult) {
          const parsedUserReserveState = {
            userAddress: userAddress,
            reserveId: reserveId,
            borrowedAmount: borrowedAmountResult,
            depositedAmount: depositedAmountResult,
            userCumulativeIndex: userCumulativeIndexResult,
          };

          // Find existing record to decide on insert or update
          // This logic might need adjustment based on your exact needs
          await db
            .insert(tables.userReserveState)
            .values(parsedUserReserveState)
            .onConflictDoUpdate({
              target: [
                tables.userReserveState.userAddress,
                tables.userReserveState.reserveId,
              ], // Assuming composite key
              set: parsedUserReserveState,
            });
        }
      }
      logger.info({
        service: "parser",
        msg: `Updated user data for address ${userAddress}`,
      });
    }
  } catch (error: Error | any) {
    logger.error({
      service: "parser",
      msg: `Failed to update user data for address ${userAddress}:`,
      error,
    });
  }
}
