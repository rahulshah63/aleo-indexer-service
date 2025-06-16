import { IndexerConfig } from "aleo-indexer/src/utils/types.js";

const indexerConfig: IndexerConfig = {
  rpcUrl: process.env.ALEO_RPC_URL || "https://testnetbeta.aleorpc.com",

  // Define the Aleo programs and their associated functions/mappings to index.
  programs: [
    {
      programId: "amm_reserve_state_v002.aleo",
      functions: [
        {
          name: "add_reserve",
          tableName: "market_reserves_historicals",
          inputs: [
            {
              name: "token_id_cipher",
              aleoType: { kind: "primitive", type: "field" },
              rpcPath: "transaction.execution.transitions[0].inputs[0].value",
            },
            {
              name: "liquidity_cumulative_index_cipher",
              aleoType: { kind: "primitive", type: "field" },
              rpcPath: "transaction.execution.transitions[0].inputs[1].value",
            },
            {
              name: "borrow_cumulative_index_cipher",
              aleoType: { kind: "primitive", type: "field" },
              rpcPath: "transaction.execution.transitions[0].inputs[2].value",
            },
            {
              name: "base_LTV_as_collateral_cipher",
              aleoType: { kind: "primitive", type: "field" },
              rpcPath: "transaction.execution.transitions[0].inputs[3].value",
            },
            {
              name: "liquidation_threshold_cipher",
              aleoType: { kind: "primitive", type: "field" },
              rpcPath: "transaction.execution.transitions[0].inputs[4].value",
            },
            {
              name: "liquidation_bonus_cipher",
              aleoType: { kind: "primitive", type: "field" },
              rpcPath: "transaction.execution.transitions[0].inputs[5].value",
            },
            {
              name: "decimals_cipher",
              aleoType: { kind: "primitive", type: "field" },
              rpcPath: "transaction.execution.transitions[0].inputs[6].value",
            },
            {
              name: "optimal_utilization_rate_cipher",
              aleoType: { kind: "primitive", type: "field" },
              rpcPath: "transaction.execution.transitions[0].inputs[7].value",
            },
            {
              name: "base_borrow_rate_cipher",
              aleoType: { kind: "primitive", type: "field" },
              rpcPath: "transaction.execution.transitions[0].inputs[8].value",
            },
            {
              name: "is_freezed_cipher",
              aleoType: { kind: "primitive", type: "field" },
              rpcPath: "transaction.execution.transitions[0].inputs[9].value",
            },
            {
              name: "is_active_cipher",
              aleoType: { kind: "primitive", type: "field" },
              rpcPath: "transaction.execution.transitions[0].inputs[10].value",
            },
            {
              name: "borrow_threshold_cipher",
              aleoType: { kind: "primitive", type: "field" },
              rpcPath: "transaction.execution.transitions[0].inputs[11].value",
            },
          ],
          outputs: [
            {
              name: "user_address",
              aleoType: { kind: "primitive", type: "address" },
              parsedPath: "arguments[0]",
              rpcPath: "transaction.execution.transitions[0].outputs[0].value",
            },
            {
              name: "last_update_block_height",
              aleoType: { kind: "primitive", type: "u32" },
              parsedPath: "arguments[2].last_update_block_height",
              rpcPath: "transaction.execution.transitions[0].outputs[0].value",
            },
            {
              name: "liquidity_rate",
              aleoType: { kind: "primitive", type: "u128" },
              parsedPath: "arguments[2].liquidity_rate",
              rpcPath: "transaction.execution.transitions[0].outputs[0].value",
            },
            {
              name: "borrow_rate",
              aleoType: { kind: "primitive", type: "u128" },
              parsedPath: "arguments[2].borrow_rate",
              rpcPath: "transaction.execution.transitions[0].outputs[0].value",
            },
            {
              name: "liquidity_cumulative_index",
              aleoType: { kind: "primitive", type: "u128" },
              parsedPath: "arguments[2].liquidity_cumulative_index",
              rpcPath: "transaction.execution.transitions[0].outputs[0].value",
            },
            {
              name: "borrow_cumulative_index",
              aleoType: { kind: "primitive", type: "u128" },
              parsedPath: "arguments[2].borrow_cumulative_index",
              rpcPath: "transaction.execution.transitions[0].outputs[0].value",
            },
            {
              name: "token_id",
              aleoType: { kind: "primitive", type: "field" },
              parsedPath: "arguments[3].token_id",
              rpcPath: "transaction.execution.transitions[0].outputs[0].value",
            },
            {
              name: "decimals",
              aleoType: { kind: "primitive", type: "u8" },
              parsedPath: "arguments[3].decimals",
              rpcPath: "transaction.execution.transitions[0].outputs[0].value",
            },
            {
              name: "base_LTV_as_collateral",
              aleoType: { kind: "primitive", type: "u128" },
              parsedPath: "arguments[3].base_LTV_as_collateral",
              rpcPath: "transaction.execution.transitions[0].outputs[0].value",
            },
            {
              name: "liquidation_threshold",
              aleoType: { kind: "primitive", type: "u128" },
              parsedPath: "arguments[3].liquidation_threshold",
              rpcPath: "transaction.execution.transitions[0].outputs[0].value",
            },
            {
              name: "liquidation_bonus",
              aleoType: { kind: "primitive", type: "u128" },
              parsedPath: "arguments[3].liquidation_bonus",
              rpcPath: "transaction.execution.transitions[0].outputs[0].value",
            },
            {
              name: "optimal_utilization_rate",
              aleoType: { kind: "primitive", type: "u128" },
              parsedPath: "arguments[3].optimal_utilization_rate",
              rpcPath: "transaction.execution.transitions[0].outputs[0].value",
            },
            {
              name: "base_borrow_rate",
              aleoType: { kind: "primitive", type: "u128" },
              parsedPath: "arguments[3].base_borrow_rate",
              rpcPath: "transaction.execution.transitions[0].outputs[0].value",
            },
            {
              name: "borrow_threshold",
              aleoType: { kind: "primitive", type: "u128" },
              parsedPath: "arguments[3].borrow_threshold",
              rpcPath: "transaction.execution.transitions[0].outputs[0].value",
            },
            {
              name: "is_freezed",
              aleoType: { kind: "primitive", type: "boolean" },
              parsedPath: "arguments[3].is_freezed",
              rpcPath: "transaction.execution.transitions[0].outputs[0].value",
            },
            {
              name: "is_active",
              aleoType: { kind: "primitive", type: "boolean" },
              parsedPath: "arguments[3].is_active",
              rpcPath: "transaction.execution.transitions[0].outputs[0].value",
            },
          ],
          // Additional fields to extract from the raw transaction that are not directly function inputs
          // extract: {
          //   callerAddress: 'transaction.execution.transitions[0].tpk', // Transaction public key of the caller
          // },
          triggersMappingUpdates: [
            {
              programId: "amm_reserve_state_v002.aleo",
              mappingName: "reserve_data",
              keySource: "token_id",
              aleoType: { kind: "primitive", type: "field" },
            },
          ],
        },
      ],
      mappings: [
        {
          name: "reserve_data",
          tableName: "reserve_data", // Corresponding SQL table name for this mapping's state
          key: {
            name: "token_id", // Name of the key field
            aleoType: { kind: "primitive", type: "field" }, // Aleo type of the key
            rpcPath: "key_id",
          },
          value: {
            // Define the value structure of the mapping
            kind: "struct", // Indicates a custom struct type
            structName: "ReserveData", // The name of the struct (will be used for GraphQL type generation)
            fields: {
              // Fields within the struct
              last_update_block_height: { kind: "primitive", type: "u32" },
              liquidity_rate: { kind: "primitive", type: "u128" },
              borrow_rate: { kind: "primitive", type: "u128" },
              liquidity_cumulative_index: { kind: "primitive", type: "u128" },
              borrow_cumulative_index: { kind: "primitive", type: "u128" },
            },
          },
          rpcValuePath: "value_id",
        },
        {
          name: "reserve_config",
          tableName: "reserve_config", // Corresponding SQL table name for this mapping's state
          key: {
            name: "token_id", // Name of the key field
            aleoType: { kind: "primitive", type: "field" }, // Aleo type of the key
            rpcPath: "key_id",
          },
          value: {
            // Define the value structure of the mapping
            kind: "struct", // Indicates a custom struct type
            structName: "ReserveConfig", // The name of the struct (will be used for GraphQL type generation)
            fields: {
              // Fields within the struct
              token_id: { kind: "primitive", type: "field" },
              decimals: { kind: "primitive", type: "u8" },
              base_LTV_as_collateral: { kind: "primitive", type: "u128" },
              liquidation_threshold: { kind: "primitive", type: "u128" },
              liquidation_bonus: { kind: "primitive", type: "u128" },
              optimal_utilization_rate: { kind: "primitive", type: "u128" },
              base_borrow_rate: { kind: "primitive", type: "u128" },
              borrow_threshold: { kind: "primitive", type: "u128" },
              is_freezed: { kind: "primitive", type: "boolean" },
              is_active: { kind: "primitive", type: "boolean" },
            },
          },
          rpcValuePath: "value_id",
        },
        {
          name: "total_deposited_amount",
          tableName: "total_deposited_amount",
          key: {
            name: "token_id",
            aleoType: { kind: "primitive", type: "field" },
            rpcPath: "key_id",
          },
          value: {
            kind: "primitive",
            type: "u128",
          },
          rpcValuePath: "value_id",
        },
        {
          name: "total_borrowed_amount",
          tableName: "total_borrowed_amount",
          key: {
            name: "token_id",
            aleoType: { kind: "primitive", type: "field" },
            rpcPath: "key_id",
          },
          value: { kind: "primitive", type: "u128" },
          rpcValuePath: "value_id",
        },
        {
          name: "total_available_liquidity",
          tableName: "total_available_liquidity",
          key: {
            name: "token_id",
            aleoType: { kind: "primitive", type: "field" },
            rpcPath: "key_id",
          },
          value: {
            kind: "primitive",
            type: "u128",
          },
          rpcValuePath: "value_id",
        },
        {
          name: "deposited_amount",
          tableName: "deposited_amount",
          key: {
            name: "user_hash",
            aleoType: { kind: "primitive", type: "field" },
            rpcPath: "key_id",
          },
          value: {
            kind: "primitive",
            type: "u128",
          },
          rpcValuePath: "value_id",
        },
        {
          name: "borrowed_amount",
          tableName: "borrowed_amount",
          key: {
            name: "user_hash",
            aleoType: { kind: "primitive", type: "field" },
            rpcPath: "key_id",
          },
          value: {
            kind: "primitive",
            type: "u128",
          },
          rpcValuePath: "value_id",
        },
        {
          name: "user_cumulative_index",
          tableName: "user_cumulative_index",
          key: {
            name: "user_hash",
            aleoType: { kind: "primitive", type: "field" },
            rpcPath: "key_id",
          },
          value: {
            kind: "primitive",
            type: "u128",
          },
          rpcValuePath: "value_id",
        },
      ],
    },
    {
      programId: "amm_user_state_v002.aleo",
      mappings: [
        {
          name: "usersdata",
          tableName: "usersdata", // Corresponding SQL table name for this mapping's state
          key: {
            name: "user_key", // Name of the key field
            aleoType: { kind: "primitive", type: "field" }, // Aleo type of the key
            rpcPath: "key_id",
          },
          value: {
            // Define the value structure of the mapping
            kind: "struct", // Indicates a custom struct type
            structName: "UserData", // The name of the struct (will be used for GraphQL type generation)
            fields: {
              // Fields within the struct
              last_updated_block_height: { kind: "primitive", type: "u32" },
              total_liquidity_balance_USD: { kind: "primitive", type: "u128" },
              total_collateral_balance_USD: { kind: "primitive", type: "u128" },
              total_borrow_balance_USD: { kind: "primitive", type: "u128" },
              total_fees_USD: { kind: "primitive", type: "u128" },
              avaialble_borrow_USD: { kind: "primitive", type: "u128" },
              current_LTV: { kind: "primitive", type: "u128" },
              current_liquidation_threshold: {
                kind: "primitive",
                type: "u128",
              },
              borrowing_power: { kind: "primitive", type: "u128" },
              health_factor_below_threshold: {
                kind: "primitive",
                type: "boolean",
              },
              collateral_needed_in_USD: { kind: "primitive", type: "u128" },
              hf_withdraw_below_threshold: {
                kind: "primitive",
                type: "boolean",
              },
            },
          },
          rpcValuePath: "value_id",
        },
      ],
    },
    {
      programId: "amm_interface_v005.aleo",
      functions: [
        {
          name: "deposit_token",
          tableName: "deposits_historicals",
          inputs: [],
          //todo: verify this
          outputs: [
            {
              name: "token_id",
              aleoType: { kind: "primitive", type: "field" },
              parsedPath: "arguments[1]",
              rpcPath: "transaction.execution.transitions[3].outputs[0].value",
            },
            {
              name: "amount",
              aleoType: { kind: "primitive", type: "u128" },
              parsedPath: "arguments[2]",
              rpcPath: "transaction.execution.transitions[3].outputs[0].value",
            },
            {
              name: "user_hash",
              aleoType: { kind: "primitive", type: "field" },
              parsedPath: "arguments[3]",
              rpcPath: "transaction.execution.transitions[3].outputs[0].value",
            },
          ],
          triggersMappingUpdates: [
            {
              programId: "amm_reserve_state_v002.aleo",
              mappingName: "reserve_data",
              keySource: "token_id",
              aleoType: { kind: "primitive", type: "field" },
            },
            {
              programId: "amm_reserve_state_v002.aleo",
              mappingName: "total_deposited_amount",
              keySource: "token_id",
              aleoType: { kind: "primitive", type: "field" },
            },
            {
              programId: "amm_reserve_state_v002.aleo",
              mappingName: "total_available_liquidity",
              keySource: "token_id",
              aleoType: { kind: "primitive", type: "field" },
            },
            {
              programId: "amm_reserve_state_v002.aleo",
              mappingName: "deposited_amount",
              keySource: "user_hash",
              aleoType: { kind: "primitive", type: "field" },
            },
            {
              programId: "amm_reserve_state_v002.aleo",
              mappingName: "user_cumulative_index",
              keySource: "user_hash",
              aleoType: { kind: "primitive", type: "field" },
            }
          ],
        },
        {
          name: "borrow_token",
          tableName: "borrows_historicals",
          inputs: [],
          //todo: verify this
          outputs: [
            {
              name: "token_id",
              aleoType: { kind: "primitive", type: "field" },
              parsedPath: "arguments[1]",
              rpcPath: "transaction.execution.transitions[14].outputs[0].value",
            },
            {
              name: "user_hash",
              aleoType: { kind: "primitive", type: "field" },
              parsedPath: "arguments[2]",
              rpcPath: "transaction.execution.transitions[14].outputs[0].value",
            },
            {
              name: "user_key",
              aleoType: { kind: "primitive", type: "field" },
              parsedPath: "arguments[4]",
              rpcPath: "transaction.execution.transitions[13].outputs[0].value",
            },
            {
              name: "borrow_amount",
              aleoType: { kind: "primitive", type: "u128" },
              parsedPath: "arguments[3]",
              rpcPath: "transaction.execution.transitions[14].outputs[0].value",
            },
            {
              name: "repay_amount",
              aleoType: { kind: "primitive", type: "u128" },
              parsedPath: "arguments[4]",
              rpcPath: "transaction.execution.transitions[14].outputs[0].value",
            },
          ],
          triggersMappingUpdates: [
            {
              programId: "amm_reserve_state_v002.aleo",
              mappingName: "reserve_data",
              keySource: "token_id",
              aleoType: { kind: "primitive", type: "field" },
            },
            {
              programId: "amm_reserve_state_v002.aleo",
              mappingName: "total_borrowed_amount",
              keySource: "token_id",
              aleoType: { kind: "primitive", type: "field" },
            },
            {
              programId: "amm_reserve_state_v002.aleo",
              mappingName: "borrowed_amount",
              keySource: "user_hash",
              aleoType: { kind: "primitive", type: "field" },
            },
            {
              programId: "amm_reserve_state_v002.aleo",
              mappingName: "total_available_liquidity",
              keySource: "token_id",
              aleoType: { kind: "primitive", type: "field" },
            },
            {
              programId: "amm_user_state_v002.aleo",
              mappingName: "usersdata",
              keySource: "user_key",
              aleoType: { kind: "primitive", type: "field" },
            },
          ],
        },
        {
          name: "withdraw_token",
          tableName: "withdraws_historicals",
          inputs: [],
          //todo: verify this
          outputs: [
            {
              name: "token_id",
              aleoType: { kind: "primitive", type: "field" },
              parsedPath: "arguments[1]",
              rpcPath: "transaction.execution.transitions[14].outputs[0].value", //todo: use index 13
            },
            {
              name: "user_hash",
              aleoType: { kind: "primitive", type: "field" },
              parsedPath: "arguments[2]",
              rpcPath: "transaction.execution.transitions[14].outputs[0].value", //todo: use index 13
            },
            {
              name: "user_key",
              aleoType: { kind: "primitive", type: "field" },
              parsedPath: "arguments[4]",
              rpcPath: "transaction.execution.transitions[12].outputs[0].value",
            },
            {
              name: "withdraw_amount",
              aleoType: { kind: "primitive", type: "u128" },
              parsedPath: "arguments[3]",
              rpcPath: "transaction.execution.transitions[14].outputs[0].value", //todo: use index 13
            },
          ],
          triggersMappingUpdates: [
            {
              programId: "amm_reserve_state_v002.aleo",
              mappingName: "reserve_data",
              keySource: "token_id",
              aleoType: { kind: "primitive", type: "field" },
            },
            {
              programId: "amm_reserve_state_v002.aleo",
              mappingName: "total_deposited_amount",
              keySource: "token_id",
              aleoType: { kind: "primitive", type: "field" },
            },
            {
              programId: "amm_reserve_state_v002.aleo",
              mappingName: "total_available_liquidity",
              keySource: "token_id",
              aleoType: { kind: "primitive", type: "field" },
            },
            {
              programId: "amm_reserve_state_v002.aleo",
              mappingName: "deposited_amount",
              keySource: "user_hash",
              aleoType: { kind: "primitive", type: "field" },
            },
            {
              programId: "amm_reserve_state_v002.aleo",
              mappingName: "user_cumulative_index",
              keySource: "user_hash",
              aleoType: { kind: "primitive", type: "field" },
            },
            {
              programId: "amm_user_state_v002.aleo",
              mappingName: "usersdata",
              keySource: "user_key",
              aleoType: { kind: "primitive", type: "field" },
            },
          ],
        },
        {
          name: "repay_token",
          tableName: "repays_historicals",
          inputs: [],
          //todo: verify this
          outputs: [
            {
              name: "token_id",
              aleoType: { kind: "primitive", type: "field" },
              parsedPath: "arguments[1]",
              rpcPath: "transaction.execution.transitions[3].outputs[0].value",
            },
            {
              name: "user_hash",
              aleoType: { kind: "primitive", type: "field" },
              parsedPath: "arguments[2]",
              rpcPath: "transaction.execution.transitions[3].outputs[0].value",
            },
            {
              name: "repay_amount",
              aleoType: { kind: "primitive", type: "u128" },
              parsedPath: "arguments[4]",
              rpcPath: "transaction.execution.transitions[3].outputs[0].value",
            },
          ],
          triggersMappingUpdates: [
            {
              programId: "amm_reserve_state_v002.aleo",
              mappingName: "reserve_data",
              keySource: "token_id",
              aleoType: { kind: "primitive", type: "field" },
            },
            {
              programId: "amm_reserve_state_v002.aleo",
              mappingName: "total_borrowed_amount",
              keySource: "token_id",
              aleoType: { kind: "primitive", type: "field" },
            },
            {
              programId: "amm_reserve_state_v002.aleo",
              mappingName: "total_available_liquidity",
              keySource: "token_id",
              aleoType: { kind: "primitive", type: "field" },
            },
            {
              programId: "amm_reserve_state_v002.aleo",
              mappingName: "borrowed_amount",
              keySource: "user_hash",
              aleoType: { kind: "primitive", type: "field" },
            }
          ],
        },
      ],
    },
  ],
};
export default indexerConfig;