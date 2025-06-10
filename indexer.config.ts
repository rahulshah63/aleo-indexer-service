import { createConfig, defineProgram } from "./src/internal/types.js";

export default createConfig({
  networks: {
    aleo: {
      chainId: "testnet3",
      rpc: process.env.RPC_URL || "https://testnet3.aleorpc.com",
    },
  },
  programs: [
    defineProgram({
      programName: "Amm_reserve_state.aleo",
      functions: [],
      mappings: [
        { name: "reserve_data", tableName: "reserveData" },
        { name: "reserve_config", tableName: "reserveConfig" },
        { name: "total_borrowed_amount", tableName: "reserveData" },
        { name: "total_deposited_amount", tableName: "reserveData" },
        { name: "total_available_liquidity", tableName: "reserveData" },
        { name: "borrowed_amount", tableName: "userReserveState" },
        { name: "deposited_amount", tableName: "userReserveState" },
        { name: "user_cumulative_index", tableName: "userReserveState" },
      ],
    }),
    defineProgram({
      programName: "Amm_user_state.aleo",
      mappings: [{ name: "usersdata", tableName: "userData" }],
      functions: []
    }),
    defineProgram({
      programName: "amm_interface_v005.aleo",
      functions: [
        {
          name: "withdraw_token",
          tableName: "creditsTransactions",
          fields: { transaction_id: "id", block_height: "blockHeight" },
        },
      ],
    }),
  ],
});

export type Config = ReturnType<typeof createConfig>;
export type NetworkConfig = Config["networks"][keyof Config["networks"]];