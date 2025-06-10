# Aleo Indexer CLI

`aleo-indexer` is a powerful and extensible command-line interface (CLI) and framework designed to help developers build and manage Aleo blockchain indexers. Inspired by the architecture and developer experience of Ponder.sh (for EVM chains), `aleo-indexer` provides a structured, type-safe, and hot-reloading environment for indexing Aleo smart contract data into a PostgreSQL database and exposing it via a GraphQL API.

## Features

- **CLI-Driven Workflow**: A dedicated CLI (`aleo-indexer dev`, `aleo-indexer start`, `aleo-indexer generate`, `aleo-indexer migrate`) for a familiar and efficient development experience.
- **Drizzle ORM Integration**: Uses Drizzle ORM for type-safe and modern database interactions with PostgreSQL, including `drizzle-kit` for schema migrations.
- **GraphQL API**: Automatically generates a GraphQL schema and provides a GraphQL API to query your indexed data, powered by `graphql-yoga` and `Hono`.
- **Hot-Reloading (Development)**: Rapid development cycles with automatic hot-reloading of your configuration and indexing logic (in `dev` mode).
- **Structured Logging**: Integrates `pino` for robust, structured, and customizable logging.
- **ESM First**: Built as a native ES Module project for modern JavaScript development.
- **Config-Driven Indexing**: Define your indexing logic (which programs, functions, and mappings to index) through a simple `indexer.config.ts` file.

## Core Concepts

- **`indexer.config.ts`**: The central configuration file where you declare the Aleo programs you want to index, specifying the functions and mappings, and how their data should be mapped to your database tables and GraphQL types.
- **Generated Schema**: Based on your `indexer.config.ts`, `aleo-indexer` automatically generates:
    - **Drizzle ORM Schema (`drizzle/generated/schema.ts`)**: Defines your database tables and their columns.
    - **GraphQL Schema (`schema.graphql`)**: Defines your GraphQL API's types and queries.
- **Processor**: The core logic that fetches Aleo transactions and mapping states from an Aleo RPC node, parses them, and inserts/updates data in your database according to your `indexer.config.ts`.
- **GraphQL Server**: A `Hono` based server that exposes your indexed data via a GraphQL API, allowing flexible querying.

## Installation (as a CLI tool)

To use `aleo-indexer` in your project, you'd typically install it as a development dependency or globally:

```bash
# In your project directory
bun add --dev aleo-indexer

# Or, if you want to use it globally (not recommended for per-project versions)
bun add --global aleo-indexer
```
# Aleo Indexer Usage Guide

## 📦 Usage (within a project)

After installing `aleo-indexer` in your project:
1. Create an `indexer.config.ts` file.  
   See [`example/indexer.config.ts`](../aleo-mm-indexer-example/indexer.config.ts) for a detailed example.

2. Use the following CLI commands:

### CLI Commands

- `aleo-indexer generate`:  
  Generates your Drizzle ORM and GraphQL schemas based on `indexer.config.ts`.  
  Run this whenever you change `indexer.config.ts`.

- `aleo-indexer migrate --generate`:  
  Generates new Drizzle migration files based on changes in your generated Drizzle schema.

- `aleo-indexer migrate`:  
  Applies pending database migrations.

- `aleo-indexer dev`:  
  Starts the indexer and GraphQL server with hot-reloading for development.

- `aleo-indexer start`:  
  Starts the indexer and GraphQL server in production mode.

---

## 🧩 Example `indexer.config.ts` Snippet

```ts
// indexer.config.ts
import { IndexerConfig } from 'aleo-indexer/dist/utils/types'; // Adjust import path if needed

const indexerConfig: IndexerConfig = {
  rpcUrl: process.env.ALEO_RPC_URL || 'http://localhost:3030',
  programs: [
    {
      programId: 'token_registry.aleo',
      functions: [
        {
          name: 'register_token',
          tableName: 'token_registrations',
          inputs: [
            { name: 'token_id', aleoType: { kind: 'primitive', type: 'field' } },
            // ... more inputs
          ],
          extract: {
            callerAddress: 'transaction.execution.transitions[0].tpk',
          },
        },
      ],
      mappings: [
        {
          name: 'token_data',
          tableName: 'token_data_map',
          key: { aleoType: { kind: 'primitive', type: 'field' } },
          value: {
            kind: 'struct',
            structName: 'TokenMetadata',
            fields: {
              // ... field definitions
            },
          },
        },
      ],
    },
  ],
};

export default indexerConfig;
```

# Development
If you are contributing to aleo-indexer itself:

- Clone the repository.

- `bun install` then `bun run build ` to compile the TypeScript code.

- You can then `bun link` in the aleo-indexer directory and `bun link aleo-indexer` in an example project to test local changes.

# Contributing
Contributions are welcome! Please feel free to open issues or submit