import { createConfig } from './src/internal/types.js';
import { defineProgram } from './src/config/program.js'

// User-facing config file
export default createConfig({
  networks: {
    aleo: {
      chainId: 'testnet3',
      rpc: process.env.RPC_URL || 'https://api.aleo.network/v1',
    },
  },
  programs: defineProgram({
    programId: 'credits.aleo',
    functions: [
      { name: 'transfer_private', tableName: 'creditsTransactions', fields: { transaction_id: 'id', block_height: 'blockHeight' } },
    ],
  }),
});
export type Config = ReturnType<typeof createConfig>;
export type ProgramConfig = Config['programs'];
export type NetworkConfig = Config['networks'][keyof Config['networks']];