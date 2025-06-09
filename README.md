# Aleo Indexer (Scaffold)

This project is a scaffold for building a custom indexer for the Aleo blockchain.

## Features

-   **BUN Runtime**: JavaScript runtime & toolkit designed for speed, complete with a bundler.
-   **Drizzle ORM**: Fully type-safe database interactions with PostgreSQL.
-   **Drizzle Kit Migrations**: Manage your database schema changes professionally.
-   **Hono + GraphQL Yoga**: A high-performance web server for your GraphQL API.
-   **Structured Logging**: Production-ready logging with Pino.
-   **ES Module Native**: Modern project structure.

## Prerequisites

-   Node.js (v22 or higher)
-   Bun
-   Docker (for running PostgreSQL easily)

## Setup

1.  **Clone the Repository and Install Dependencies:**
    ```bash
    # Clone or create the project files...
    bun install
    ```

2.  **Start a PostgreSQL Database:**
    The easiest way is with Docker.
    ```bash
    docker run --name aleo-db -e POSTGRES_PASSWORD=mysecretpassword -e POSTGRES_USER=user -e POSTGRES_DB=aleo_indexer -p 5432:5432 -d postgres
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the root of the project.

    ```
    # Aleo RPC Endpoint
    RPC_URL=[https://api.aleo.network/v1](https://api.aleo.network/v1)

    # PostgreSQL Connection URL for Drizzle
    DATABASE_URL=postgresql://user:mysecretpassword@localhost:5432/aleo_indexer
    ```

4.  **Generate and Run Database Migrations:**
    This command compares your schema (`src/database/schema.ts`) with the database and generates SQL migration files.

    ```bash
    bun run db:generate
    ```
    After generation, you would typically run the migration, but for this simple setup, Drizzle can push the schema directly.

5.  **Run the Development Server:**
    This starts the indexer and GraphQL server with hot-reloading.
    ```bash
    bun run dev
    ```

6.  **Access the GraphQL API:**
    The GraphQL playground is available at [http://localhost:4000/graphql](http://localhost:4000/graphql).

## CLI Commands

-   `bun run dev`: Starts the development server with hot-reloading.
-   `bun run db:generate`: Generates SQL migration files based on your Drizzle schema.