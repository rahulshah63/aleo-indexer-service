// aleo-indexer/src/core/processor.ts

import { logger } from "../utils/logger.js";
import {
  getNestedValue,
  ProgramConfig,
  FunctionConfig,
  AleoValueType,
  DbInstance,
  GeneratedSchema,
  parseJSONLikeString,
  parseLeoTypedJSON,
  JS2Leo,
} from "../utils/types.js";
import { callRpc, AleoTransaction, AleoTransition } from "./rpc.js";
import pLimit from 'p-limit';
import "dotenv/config";

/**
 * Represents a request to update a specific mapping key's value,
 * originating from a processed function call.
 */
interface MappingUpdateCandidate {
  programId: string;
  mappingName: string;
  key: string;
  value?: string; // Optional: The raw Aleo string representation of the value, if directly available from function output/finalize
  blockHeight: number; // The block height at which this update was observed
}

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || "20"); // Number of transactions to fetch per RPC call
const MAX_PAGES_PER_FUNCTION_CYCLE = parseInt(
  process.env.MAX_PAGES_PER_FUNCTION_CYCLE || "10"
); // Limit pages fetched per function per cycle to avoid huge batches

/**
 * Parses a transaction and its specific transition to extract base data, function-specific data,
 * and mapping update candidates based on a given configuration.
 *
 * @param {object} tx The entire transaction object from the RPC response.
 * @param {object} transition The specific transition object within the transaction to process.
 * @param {object} funcConfig The configuration for the function corresponding to the transition.
 * @param {object} programConfig The overall configuration for the program.
 * @returns {{baseTxData: object, funcSpecificData: object, mappingUpdateCandidates: Array<object>}}
 */
function parseTransactionAndCollectMappingUpdates(
  tx: AleoTransaction,
  transition: AleoTransition,
  funcConfig: FunctionConfig,
  programConfig: ProgramConfig
): {
  baseTxData: object;
  funcSpecificData: object;
  mappingUpdateCandidates: MappingUpdateCandidate[];
} {
  // Extract common fields for the main transactions table
  const baseTxData = {
    id: tx.transaction.id,
    programId: transition?.program || "unknown",
    functionName: transition?.function || "unknown",
    blockHeight: tx.finalizedAt ? parseInt(tx.finalizedAt) : 0,
    timestamp: tx.finalizedAt
      ? new Date(parseInt(tx.finalizedAt) * 1000)
      : new Date(),
    inserted_at: new Date(),
    raw: tx, // Store the entire raw transaction for debugging/auditing
  };

  // Extract specific fields for the function's dedicated table
  const funcSpecificData: Record<string, any> = {};

  // --- PROCESS INPUTS ---
  const transitionInputs = transition?.inputs;
  for (const input of funcConfig.inputs || []) {
    let inputValue;
    if (input.rpcPath) {
      inputValue = getNestedValue(tx, input.rpcPath);
    } else if (transitionInputs) {
      const foundInput = transitionInputs.find((i) => i.id === input.name);
      inputValue = parseLeoTypedJSON(foundInput?.value);
    }
    funcSpecificData[input.name] = inputValue;
  }

  // --- PROCESS OUTPUTS ---
  for (const output of funcConfig.outputs || []) {
    let outputValue;

    if (output.rpcPath) {
      outputValue = getNestedValue(tx, output.rpcPath);
    } else {
      logger.warn({
        service: "processor",
        msg: `Output configuration for '${output.name}' is missing 'rpcPath'. Cannot extract value.`,
        transactionId: tx.transaction.id,
      });
      continue;
    }

    if (outputValue === undefined) {
      logger.warn({
        service: "processor",
        msg: `Value not found for output '${output.name}' using rpcPath '${output.rpcPath}'.`,
        transactionId: tx.transaction.id,
      });
      continue;
    }

    // If the value is a json stringified, it might be a complex type that needs parsing.
    if (typeof outputValue === "string") {
      try {
        const parsedData = parseJSONLikeString(outputValue);
        if (output.parsedPath) {
          outputValue = getNestedValue(parsedData, output.parsedPath);
        } else {
          outputValue = parsedData;
        }
      } catch (e) {
        // If it fails to parse, assume it's a plain string and proceed.
      }
    }

    try {
      outputValue = parseLeoTypedJSON(outputValue);
    } catch (e) {
      logger.warn({
        service: "processor",
        msg: `Failed to perform final Leo-type parsing for output '${output.name}': ${outputValue}`,
        error: e,
      });
    }

    funcSpecificData[output.name] = outputValue;
  }

  // --- PROCESS EXTRACTIONS ---
  for (const dbColumnName in funcConfig.extract) {
    const rpcPath = funcConfig.extract[dbColumnName];
    funcSpecificData[dbColumnName] = getNestedValue(tx, rpcPath);
  }

  // --- COLLECT MAPPING UPDATES ---
  const mappingUpdateCandidates = [];
  const blockHeight = baseTxData.blockHeight;

  if (funcConfig.triggersMappingUpdates) {
    for (const trigger of funcConfig.triggersMappingUpdates) {
      const key = getNestedValue(funcSpecificData, trigger.keySource);
      if (key !== undefined) {
        const candidate: MappingUpdateCandidate = {
          programId: trigger.programId,
          mappingName: trigger.mappingName,
          key: JS2Leo(
            String(key),
            trigger.aleoType.kind === "primitive"
              ? trigger.aleoType.type
              : undefined
          ),
          blockHeight: blockHeight,
        };
        if (trigger.valueSource) {
          const value = getNestedValue(funcSpecificData, trigger.valueSource);
          if (value !== undefined) {
            candidate.value = String(value);
          }
        }
        mappingUpdateCandidates.push(candidate);
      } else {
        logger.warn({
          service: "processor",
          msg: `Mapping update trigger for '${trigger.mappingName}' in function '${funcConfig.name}' could not extract key from source '${trigger.keySource}'.`,
          transactionId: tx.transaction.id,
        });
      }
    }
  }

  // Collect updates from the transaction's 'finalize' section
  if (tx.finalize && tx.finalizedAt) {
    for (const finalizeEntry of tx.finalize) {
      const matchingMappingConfig = programConfig.mappings?.find(
        (m) => m.name === finalizeEntry.mapping_id.split("/").pop()
      );
      if (matchingMappingConfig) {
        const key = getNestedValue(
          finalizeEntry,
          matchingMappingConfig.key.rpcPath || "key_id"
        );
        const value = getNestedValue(
          finalizeEntry,
          matchingMappingConfig.rpcValuePath || "value_id"
        );
        if (key !== undefined && value !== undefined) {
          mappingUpdateCandidates.push({
            programId: programConfig.programId,
            mappingName: matchingMappingConfig.name,
            key: String(key),
            value: String(value),
            blockHeight: blockHeight,
          });
        } else {
          logger.warn({
            service: "processor",
            msg: `Finalize entry for mapping '${matchingMappingConfig.name}' could not extract key or value.`,
            transactionId: tx.transaction.id,
          });
        }
      }
    }
  }

  return {
    baseTxData,
    funcSpecificData,
    mappingUpdateCandidates,
  };
}

/**
 * Fetches and processes transactions for a program's functions based on their total indexed transaction counts.
 * It dynamically calculates the page and offset for RPC calls.
 *
 * @param programConfig The configuration for the current Aleo program.
 * @param rpcUrl The RPC URL to use for API calls.
 * @param db The Drizzle DB instance.
 * @param schema The dynamically loaded Drizzle schema.
 * @param functionProgress An object mapping each function name to its total indexed transaction count.
 * @returns An object containing the new transaction counts and a list of generated mapping update candidates.
 */
export async function handleProgramFunctions(
  programConfig: ProgramConfig,
  rpcUrl: string,
  db: DbInstance,
  schema: GeneratedSchema,
  functionProgress: { [functionName: string]: number }
): Promise<{
  newFunctionProgress: { [functionName: string]: number };
  mappingUpdateCandidates: MappingUpdateCandidate[];
}> {
  logger.info({
    service: "processor",
    msg: `Processing functions for program '${programConfig.programId}' starting from overall page ${functionProgress}`,
  });

  const allMappingUpdateCandidates: MappingUpdateCandidate[] = [];
  const processedTransactionsSet = new Set<string>();
  const transactionsCollectedInThisCycle: AleoTransaction[] = [];

  // This will be populated with the new transaction counts and returned.
  const newFunctionProgress = { ...functionProgress };

  logger.info({
    service: "processor",
    msg: `Starting function processing for program '${programConfig.programId}'.`,
  });

  if (!programConfig.functions || programConfig.functions.length === 0) {
    return {
      newFunctionProgress,
      mappingUpdateCandidates: allMappingUpdateCandidates,
    };
  }
  const limit = pLimit(parseInt(process.env.FUNCTION_CONCURRENCY_LIMIT || "10"));

 const functionProcessingPromises: Promise<void>[] = programConfig.functions.map(funcConfig =>
    limit(async () => {let hasMoreTransactionsForFunction = true;

    // Get the starting transaction count for this specific function.
    let txnCountForFunc = newFunctionProgress[funcConfig.name] || 0;

    logger.info({
      service: "processor",
      msg: `Processing function '${funcConfig.name}' for program '${programConfig.programId}', starting from indexed count ${txnCountForFunc}.`,
    });

    while (hasMoreTransactionsForFunction && (txnCountForFunc - newFunctionProgress[funcConfig.name] || 0) < MAX_PAGES_PER_FUNCTION_CYCLE * BATCH_SIZE) {
      const pageToProcess = Math.floor(txnCountForFunc / BATCH_SIZE);

      let transactionsBatch: AleoTransaction[] = [];
      try {
        const rpcPayload = {
          programId: programConfig.programId,
          functionName: funcConfig.name,
          page: pageToProcess,
          maxTransactions: BATCH_SIZE,
        };
        logger.info({
          service: "processor",
          msg: `Fetching transactions for ${programConfig.programId}:${funcConfig.name} on calculated page ${pageToProcess}.`,
          rpcPayload,
        });

        const response = await callRpc<AleoTransaction[]>(
          rpcUrl,
          "aleoTransactionsForProgram",
          rpcPayload
        );

        // Filter for finalized or accepted execute transactions.
        transactionsBatch = (response || []).filter(
          (tx) =>
            tx.status === "finalized" ||
            (tx.status === "accepted" && tx.type === "execute")
        );
      } catch (e: any) {
        if (e.message.includes("RPC permanent error")) {
          logger.error({
            service: "processor",
            msg: `Permanent RPC error fetching transactions for ${programConfig.programId}:${funcConfig.name} on page ${pageToProcess}: ${e.message}`,
            error: e.message,
          });
          hasMoreTransactionsForFunction = false; // Stop fetching for this function due to critical error
          // Consider a mechanism to halt overall program indexing if a permanent error is truly unrecoverable.
          // For now, it just stops this function, allowing others to proceed if they can.
          return;
        }
        logger.warn({
          service: "processor",
          msg: `Transient error fetching transactions for ${programConfig.programId}:${funcConfig.name} on page ${pageToProcess}: ${e.message}`,
          error: e.message,
        });
        hasMoreTransactionsForFunction = false; 
        return;
      }

      if (transactionsBatch.length === 0) {
        logger.info({
          service: "processor",
          msg: `No new finalized transactions for ${programConfig.programId}:${funcConfig.name} on calculated page ${pageToProcess}.`,
        });
        hasMoreTransactionsForFunction = false;
        continue;
      } else {
        logger.info({
          service: "processor",
          msg: `Fetched ${transactionsBatch.length} potential transactions for ${programConfig.programId}:${funcConfig.name} on calculated page ${pageToProcess}.`,
        });
      }

      const offset = txnCountForFunc % BATCH_SIZE;
      const newTransactionsToProcess = transactionsBatch.slice(offset);

      if (newTransactionsToProcess.length === 0) {
        logger.info({
          service: "processor",
          msg: `All transactions on page ${pageToProcess} for ${programConfig.programId}:${funcConfig.name} have already been processed (offset: ${offset}).`,
        });
        hasMoreTransactionsForFunction = false;
        continue;
      }

      logger.info({
        service: "processor",
        msg: `Processing ${newTransactionsToProcess.length} actual new transactions for ${programConfig.programId}:${funcConfig.name} after offset ${offset}.`,
      });

      // CRITICAL: When collecting transactions concurrently, ensure thread safety for shared arrays/sets.
      // we just need to be mindful that the *order* of addition here doesn't matter for the final set,
      for (const tx of newTransactionsToProcess) {
        if (!processedTransactionsSet.has(tx.transaction.id)) {
          transactionsCollectedInThisCycle.push(tx);
          processedTransactionsSet.add(tx.transaction.id);
        }
      }

      txnCountForFunc += newTransactionsToProcess.length;

      // Only continue fetching if the RPC returned a full batch. If less than BATCH_SIZE
      // was returned, it implies we've reached the current "tip" of available transactions
      // for this function from the RPC, so we stop fetching for this function in this cycle.
      if (transactionsBatch.length < BATCH_SIZE) {
        logger.info({
          service: "processor",
          msg: `RPC returned less than ${BATCH_SIZE} transactions (${transactionsBatch.length}) for ${programConfig.programId}:${funcConfig.name}, indicating end of current available data.`,
        });
        hasMoreTransactionsForFunction = false;
      }
    }

    // Update the progress map with the final count for this function after its dedicated fetching loop.
    newFunctionProgress[funcConfig.name] = txnCountForFunc;
  }));

  // Wait for all function processing promises to complete
  await Promise.all(functionProcessingPromises);

  //todo: IF we want to halt on any permanent error like RPC
  // try {
  //   await Promise.all(functionProcessingPromises);
  // } catch (error) {
  //   logger.error({ service: 'processor', msg: `Critical error during concurrent function processing: ${error.message}` });
  //   // Decide whether to re-throw or handle as a fatal error for the program
  //   throw error;
  // }

  // Process Collected Transactions
  if (transactionsCollectedInThisCycle.length === 0) {
    logger.info({
      service: "processor",
      msg: `No new unique transactions collected across all functions for program '${programConfig.programId}' in this cycle.`,
    });
    // Return current progress if no new transactions were found
    return {
      newFunctionProgress,
      mappingUpdateCandidates: allMappingUpdateCandidates,
    };
  }

  logger.info({
    service: "processor",
    msg: `Collected ${transactionsCollectedInThisCycle.length} unique new transactions for program '${programConfig.programId}' for processing.`,
  });

  // Sort all collected transactions by timestamp
  // This ensures sequential processing, which is crucial for state-based indexing.
  // This sort happens once, after all concurrent fetches are complete.
  transactionsCollectedInThisCycle.sort((a, b) => {
    const blockA = parseInt(a.finalizedAt || "0");
    const blockB = parseInt(b.finalizedAt || "0");
    return blockA - blockB;
  });

  // Prepare data for batch inserts
  const baseTransactionsToInsert: any[] = [];
  const functionSpecificInserts: { [tableName: string]: any[] } = {};

  for (const tx of transactionsCollectedInThisCycle) {
    const transitions = tx.transaction?.execution?.transitions;
    if (!transitions || !Array.isArray(transitions)) {
      continue;
    }

    for (const transition of transitions) {
      const functionName = transition?.function;
      const funcConfig = programConfig.functions.find(
        (f) => f.name === functionName
      );

      if (funcConfig) {
        // Call parseTransactionAndCollectMappingUpdates to get structured data
        const { baseTxData, funcSpecificData, mappingUpdateCandidates } =
          parseTransactionAndCollectMappingUpdates(
            tx,
            transition,
            funcConfig,
            programConfig
          );
        baseTransactionsToInsert.push(baseTxData);

        if (!functionSpecificInserts[funcConfig.tableName]) {
          functionSpecificInserts[funcConfig.tableName] = [];
        }

        functionSpecificInserts[funcConfig.tableName].push({
          transactionId: tx.transaction.id,
          ...funcSpecificData,
        });

        allMappingUpdateCandidates.push(...mappingUpdateCandidates);
      } else {
        logger.warn({
          service: "processor",
          msg: `Transaction contains unconfigured function '${functionName}' for program '${programConfig.programId}'. Skipping transition.`,
          transactionId: tx.transaction.id,
        });
      }
    }
  }

  // Perform batch inserts for base transactions
  if (baseTransactionsToInsert.length > 0) {
    try {
      await db
        .insert(schema.transactions)
        .values(baseTransactionsToInsert)
        .onConflictDoNothing({ target: schema.transactions.id }); // Prevents inserting duplicates
      logger.info({
        service: "processor",
        msg: `Inserted ${baseTransactionsToInsert.length} base transactions for ${programConfig.programId}.`,
      });
    } catch (error: any) {
      logger.error({
        service: "processor",
        msg: `Failed to insert base transactions for ${programConfig.programId}: ${error.message}`,
        error: error.message,
        transactions: baseTransactionsToInsert.map((tx) => tx.id),
      });
    }
  }

  // Perform batch inserts for function-specific tables
  for (const tableName in functionSpecificInserts) {
    const records = functionSpecificInserts[tableName];
    if (records.length > 0) {
      const targetTable = schema[tableName]; // Access the table dynamically from the schema object
      if (targetTable) {
        try {
          await db.insert(targetTable).values(records).onConflictDoNothing();
          logger.info({
            service: "processor",
            msg: `Inserted ${records.length} records into '${tableName}' for ${programConfig.programId}.`,
          });
        } catch (error: any) {
          logger.error({
            service: "processor",
            msg: `Failed to insert records into '${tableName}' for ${programConfig.programId}: ${error.message}`,
            error: error.message,
          });
        }
      } else {
        logger.error({
          service: "processor",
          msg: `Drizzle table '${tableName}' not found in the loaded schema. Skipping inserts for this table.`,
        });
      }
    }
  }

  return {
    newFunctionProgress,
    mappingUpdateCandidates: allMappingUpdateCandidates,
  };
}

/**
 * Handles the indexing of mappings defined in a program configuration.
 * Fetches mapping values from RPC and updates the corresponding tables,
 * primarily driven by candidates generated from function processing.
 * @param mappingUpdateCandidates A list of mapping update requests generated from function processing.
 * @param programConfigs All program configurations to find mapping definitions.
 * @param rpcUrl The RPC URL to use for API calls.
 * @param db The Drizzle DB instance.
 * @param schema The dynamically loaded Drizzle schema.
 */
export async function handleProgramMappings(
  mappingUpdateCandidates: MappingUpdateCandidate[],
  programConfigs: ProgramConfig[], // Needs all program configs to find mapping definitions
  rpcUrl: string,
  db: DbInstance,
  schema: GeneratedSchema
) {
  if (mappingUpdateCandidates.length === 0) {
    logger.info({
      service: "processor",
      msg: "No mapping update candidates to process.",
    });
    return;
  }

  logger.info({
    service: "processor",
    msg: `Processing ${mappingUpdateCandidates.length} mapping update candidates.`,
  });

  // Use a Set to store unique key-mapping pairs to avoid redundant RPC calls and DB updates
  // Format: `${programId}:${mappingName}:${key}`
  const uniqueUpdatesToProcess = new Set<string>();
  mappingUpdateCandidates.forEach((candidate) => {
    uniqueUpdatesToProcess.add(
      `${candidate.programId}:${candidate.mappingName}:${candidate.key}`
    );
  });

  for (const uniqueKey of uniqueUpdatesToProcess) {
    const [programId, mappingName, keyString] = uniqueKey.split(":");

    // Find the relevant mapping configuration
    const programConfig = programConfigs.find((p) => p.programId === programId);
    const mappingConfig = programConfig?.mappings?.find(
      (m) => m.name === mappingName
    );

    if (!mappingConfig) {
      logger.warn({
        service: "processor",
        msg: `Mapping configuration not found for '${mappingName}' in program '${programId}'. Skipping update.`,
      });
      continue;
    }

    const targetTable = schema[mappingConfig.tableName];
    if (!targetTable) {
      logger.error({
        service: "processor",
        msg: `Generated table '${mappingConfig.tableName}' not found in schema for mapping '${mappingName}'. Skipping update.`,
      });
      continue;
    }

    try {
      const originalCandidate = mappingUpdateCandidates.find(
        (c) =>
          c.programId === programId &&
          c.mappingName === mappingName &&
          c.key === keyString
      );
      const blockHeight = originalCandidate?.blockHeight || 0; 

      let rpcValue: string | undefined = originalCandidate?.value; // Use pre-extracted value if available

      if (rpcValue === undefined) {
        // If value wasn't directly provided by the function processing/finalize, fetch it via RPC
        rpcValue = await callRpc<string>(rpcUrl, "getMappingValue", {
          program_id: programId,
          mapping_name: mappingConfig.name,
          key: keyString,
        });
      }

      if (rpcValue !== undefined && rpcValue !== null) {
        const key = parseAleoValue(keyString, mappingConfig.key.aleoType);
        const parsedJsonValue = parseJSONLikeString(rpcValue);
        //for all value, convert to js type
        const dataToInsert = parseLeoTypedJSON(parsedJsonValue);

        await db
          .insert(targetTable)
          .values({
            key: key,
            value: dataToInsert,
            lastUpdatedBlock: blockHeight,
          })
          .onConflictDoUpdate({
            target: targetTable.key,
            set: {
              value: dataToInsert,
              lastUpdatedBlock: blockHeight,
            },
          });
        logger.debug({
          service: "processor",
          msg: `Updated mapping '${mappingConfig.name}' with key '${keyString}' in block ${blockHeight}.`,
        });
      } else {
        logger.debug({
          service: "processor",
          msg: `Mapping '${mappingConfig.name}' for key '${keyString}' returned no value from RPC. It might have been deleted or not exist.`,
        });
      }
    } catch (error: any) {
      logger.warn({
        service: "processor",
        msg: `Failed to fetch or update mapping '${mappingConfig.name}' for key '${keyString}': ${error.message}`,
        error: error.message,
      });
    }
  }
}

/**
 * Helper to parse Aleo values (from RPC strings) into appropriate JS types.
 * @param aleoValueStr The string value from Aleo RPC (e.g., "123u128", "aleo123...", "{a: 1u8}").
 * @param targetType The expected Aleo type.
 * @returns The parsed JavaScript value.
 */
function parseAleoValue(aleoValueStr: string, targetType: AleoValueType): any {
  if (targetType.kind === "primitive") {
    switch (targetType.type) {
      case "address":
      case "field":
      case "boolean":
        return aleoValueStr;
      case "u8":
      case "u16":
      case "u32":
        return parseInt(aleoValueStr.replace(/u(8|16|32)/, ""));
      case "u64":
      case "u128":
        return BigInt(aleoValueStr.replace(/u(64|128)/, ""));
      default:
        return aleoValueStr;
    }
  } else if (
    targetType.kind === "record" ||
    targetType.kind === "struct" ||
    targetType.kind === "array"
  ) {
    try {
      return parseJSONLikeString(aleoValueStr);
    } catch (e) {
      logger.warn({
        service: "processor",
        msg: `Failed to parse complex Aleo value string as JSON for type ${targetType.kind}: ${aleoValueStr}`,
        error: e,
      });
      return aleoValueStr;
    }
  }
  return aleoValueStr;
}
