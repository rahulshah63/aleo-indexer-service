import { createConfig } from "./src/internal/types.js";
import { defineProgram } from "./src/config/program.js";

// User-facing config file
export default createConfig({
  networks: {
    aleo: {
      chainId: "testnet3",
      rpc: process.env.RPC_URL || "https://testnet3.aleorpc.com",
    },
  },
  programs: [
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
