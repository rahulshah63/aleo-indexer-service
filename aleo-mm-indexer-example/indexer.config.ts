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
          tableName: 'market_reserves',
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
          // NEW: This function triggers updates for the 'token_data' mapping
          // triggersMappingUpdates: [
          //   {
          //     mappingName: 'token_data',
          //     keySource: 'token_id', // The 'token_id' extracted from this function's inputs is the mapping key
          //   }
          // ]
        },
      ],
    },
    // {
    //   programId: 'token_registry.aleo',
    //   functions: [
    //     {
    //       name: 'register_token', // Name of the Aleo function
    //       tableName: 'token_registrations', // Corresponding SQL table name for this function's events
    //       inputs: [ // Define the inputs to extract from this function's transitions
    //         { name: 'token_id', aleoType: { kind: 'primitive', type: 'field' }, rpcPath: 'transaction.execution.transitions[0].inputs[0].value' },
    //         { name: 'token_symbol', aleoType: { kind: 'primitive', type: 'field' }, rpcPath: 'transaction.execution.transitions[0].inputs[1].value' },
    //         { name: 'decimals', aleoType: { kind: 'primitive', type: 'u8' }, rpcPath: 'transaction.execution.transitions[0].inputs[2].value' },
    //         { name: 'supply_public', aleoType: { kind: 'primitive', type: 'u128' }, rpcPath: 'transaction.execution.transitions[0].inputs[3].value' },
    //       ],
    //       // Additional fields to extract from the raw transaction that are not directly function inputs
    //       extract: {
    //         callerAddress: 'transaction.execution.transitions[0].tpk', // Transaction public key of the caller
    //       },
    //       // NEW: This function triggers updates for the 'token_data' mapping
    //       triggersMappingUpdates: [
    //         {
    //           mappingName: 'token_data',
    //           keySource: 'token_id', // The 'token_id' extracted from this function's inputs is the mapping key
    //           // valueSource is not needed here as token_data mapping values are complex and best fetched via getMappingValue
    //         }
    //       ]
    //     },
    //   ],

    //   // Configuration for specific mappings within this program
    //   mappings: [
    //     {
    //       name: 'token_data', // Name of the Aleo mapping
    //       tableName: 'token_data_map', // Corresponding SQL table name for this mapping's state
    //       key: {
    //         name: 'token_id', // Name of the key field
    //         aleoType: { kind: 'primitive', type: 'field' }, // Aleo type of the key
    //         rpcPath: 'key_id', // Path within the `finalize` entry to get the key
    //       },
    //       value: { // Define the value structure of the mapping
    //         kind: 'struct', // Indicates a custom struct type
    //         structName: 'TokenMetadata', // The name of the struct (will be used for GraphQL type generation)
    //         fields: { // Fields within the struct
    //           symbol: { kind: 'primitive', type: 'field' },
    //           decimals: { kind: 'primitive', type: 'u8' },
    //           total_supply: { kind: 'primitive', type: 'u128' },
    //           owner: { kind: 'primitive', type: 'address' },
    //         },
    //       },
    //       rpcValuePath: 'value_id', // Path within the `finalize` entry to get the value
    //     }
    //   ],
    // },
    // Add more programs if you want to index multiple Aleo programs
  ],
};

export default indexerConfig;