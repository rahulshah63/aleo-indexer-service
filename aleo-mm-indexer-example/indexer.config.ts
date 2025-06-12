import { IndexerConfig } from 'aleo-indexer/src/utils/types.js';

const indexerConfig: IndexerConfig = {
  rpcUrl: process.env.ALEO_RPC_URL || 'https://testnetbeta.aleorpc.com',

  // Define the Aleo programs and their associated functions/mappings to index.
  programs: [
    {
      programId: 'amm_reserve_state_v002.aleo',
      functions: [
        {
          name: 'add_reserve',
          tableName: 'market_reserves_historicals',
          inputs: [ 
            { name: 'token_id_cipher', aleoType: { kind: 'primitive', type: 'field' }, rpcPath: 'transaction.execution.transitions[0].inputs[0].value' },
            { name: 'liquidity_cumulative_index_cipher', aleoType: { kind: 'primitive', type: 'field' }, rpcPath: 'transaction.execution.transitions[0].inputs[1].value' },
            { name: 'borrow_cumulative_index_cipher', aleoType: { kind: 'primitive', type: 'field' }, rpcPath: 'transaction.execution.transitions[0].inputs[2].value' },
            { name: 'base_LTV_as_collateral_cipher', aleoType: { kind: 'primitive', type: 'field' }, rpcPath: 'transaction.execution.transitions[0].inputs[3].value' },
            { name: 'liquidation_threshold_cipher', aleoType: { kind: 'primitive', type: 'field' }, rpcPath: 'transaction.execution.transitions[0].inputs[4].value' },
            { name: 'liquidation_bonus_cipher', aleoType: { kind: 'primitive', type: 'field' }, rpcPath: 'transaction.execution.transitions[0].inputs[5].value' },
            { name: 'decimals_cipher', aleoType: { kind: 'primitive', type: 'field' }, rpcPath: 'transaction.execution.transitions[0].inputs[6].value' },
            { name: 'optimal_utilization_rate_cipher', aleoType: { kind: 'primitive', type: 'field' }, rpcPath: 'transaction.execution.transitions[0].inputs[7].value' },
            { name: 'base_borrow_rate_cipher', aleoType: { kind: 'primitive', type: 'field' }, rpcPath: 'transaction.execution.transitions[0].inputs[8].value' },
            { name: 'is_freezed_cipher', aleoType: { kind: 'primitive', type: 'field' }, rpcPath: 'transaction.execution.transitions[0].inputs[9].value' },
            { name: 'is_active_cipher', aleoType: { kind: 'primitive', type: 'field' }, rpcPath: 'transaction.execution.transitions[0].inputs[10].value' },
            { name: 'borrow_threshold_cipher', aleoType: { kind: 'primitive', type: 'field' }, rpcPath: 'transaction.execution.transitions[0].inputs[11].value' },
          ],
          outputs: [ 
            { name: 'user_address', aleoType: { kind: 'primitive', type: 'address' }, parsedPath: "arguments[0]" },
            { name: 'last_update_block_height', aleoType: { kind: 'primitive', type: 'u32' }, parsedPath: "arguments[2].last_update_block_height" },
            { name: 'liquidity_rate', aleoType: { kind: 'primitive', type: 'u128' }, parsedPath: "arguments[2].liquidity_rate" },
            { name: 'borrow_rate', aleoType: { kind: 'primitive', type: 'u128' }, parsedPath: "arguments[2].borrow_rate" },
            { name: 'liquidity_cumulative_index', aleoType: { kind: 'primitive', type: 'u128' }, parsedPath: "arguments[2].liquidity_cumulative_index" },
            { name: 'borrow_cumulative_index', aleoType: { kind: 'primitive', type: 'u128' }, parsedPath: "arguments[2].borrow_cumulative_index" },
            { name: 'token_id', aleoType: { kind: 'primitive', type: 'field' }, parsedPath: "arguments[3].token_id" },
            { name: 'decimals', aleoType: { kind: 'primitive', type: 'u8' }, parsedPath: "arguments[3].decimals" },
            { name: 'base_LTV_as_collateral', aleoType: { kind: 'primitive', type: 'u128' }, parsedPath: "arguments[3].base_LTV_as_collateral" },
            { name: 'liquidation_threshold', aleoType: { kind: 'primitive', type: 'u128' }, parsedPath: "arguments[3].liquidation_threshold" },
            { name: 'liquidation_bonus', aleoType: { kind: 'primitive', type: 'u128' }, parsedPath: "arguments[3].liquidation_bonus" },
            { name: 'optimal_utilization_rate', aleoType: { kind: 'primitive', type: 'u128' }, parsedPath: "arguments[3].optimal_utilization_rate" },
            { name: 'base_borrow_rate', aleoType: { kind: 'primitive', type: 'u128' }, parsedPath: "arguments[3].base_borrow_rate" },
            { name: 'borrow_threshold', aleoType: { kind: 'primitive', type: 'u128' }, parsedPath: "arguments[3].borrow_threshold" },
            { name: 'is_freezed', aleoType: { kind: 'primitive', type: 'boolean' }, parsedPath: "arguments[3].is_freezed" },
            { name: 'is_active', aleoType: { kind: 'primitive', type: 'boolean' }, parsedPath: "arguments[3].is_active" },
          ],
          // Additional fields to extract from the raw transaction that are not directly function inputs
          // extract: {
          //   callerAddress: 'transaction.execution.transitions[0].tpk', // Transaction public key of the caller
          // },
          triggersMappingUpdates: [
            {
              mappingName: 'reserve_data',
              keySource: 'token_id',
              aleoType: { kind: 'primitive', type: 'field' }
            }
          ]
        },
      ],
      mappings: [
        {
          name: 'reserve_data',
          tableName: 'reserve_data_mapping', // Corresponding SQL table name for this mapping's state
          key: {
            name: 'token_id', // Name of the key field
            aleoType: { kind: 'primitive', type: 'field' }, // Aleo type of the key
            rpcPath: 'key_id',
          },
          value: { // Define the value structure of the mapping
            kind: 'struct', // Indicates a custom struct type
            structName: 'ReserveData', // The name of the struct (will be used for GraphQL type generation)
            fields: { // Fields within the struct
              last_update_block_height: { kind: 'primitive', type: 'u32' },
              liquidity_rate: { kind: 'primitive', type: 'u128' },
              borrow_rate: { kind: 'primitive', type: 'u128' },
              liquidity_cumulative_index: { kind: 'primitive', type: 'u128' },
              borrow_cumulative_index: { kind: 'primitive', type: 'u128' },
            },
          },
          rpcValuePath: 'value_id',
        },
        {
          name: 'reserve_config',
          tableName: 'reserve_config_mapping', // Corresponding SQL table name for this mapping's state
          key: {
            name: 'token_id', // Name of the key field
            aleoType: { kind: 'primitive', type: 'field' }, // Aleo type of the key
            rpcPath: 'key_id',
          },
          value: { // Define the value structure of the mapping
            kind: 'struct', // Indicates a custom struct type
            structName: 'ReserveConfig', // The name of the struct (will be used for GraphQL type generation)
            fields: { // Fields within the struct
              token_id: { kind: 'primitive', type: 'field' },
              decimals: { kind: 'primitive', type: 'u8' },
              base_LTV_as_collateral: { kind: 'primitive', type: 'u128' },
              liquidation_threshold: { kind: 'primitive', type: 'u128' },
              liquidation_bonus: { kind: 'primitive', type: 'u128' },
              optimal_utilization_rate: { kind: 'primitive', type: 'u128' },
              base_borrow_rate: { kind: 'primitive', type: 'u128' },
              borrow_threshold: { kind: 'primitive', type: 'u128' },
              is_freezed: { kind: 'primitive', type: 'boolean' },
              is_active: { kind: 'primitive', type: 'boolean' },
            },
          },
          rpcValuePath: 'value_id',
        }
      ],
    },
    // Add more programs if you want to index multiple Aleo programs
  ],
};

export default indexerConfig;