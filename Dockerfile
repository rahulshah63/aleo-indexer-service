FROM oven/bun:latest

WORKDIR /app

COPY aleo-indexer ./aleo-indexer

COPY aleo-mm-indexer-example ./aleo-mm-indexer-example

WORKDIR /app/aleo-indexer
RUN bun install
RUN bun run build
RUN bun link

WORKDIR /app/aleo-mm-indexer-example
RUN bun install
RUN bun link aleo-indexer
RUN bun run generate-schemas
RUN bun run db:generate-migration
RUN bun run db:migrate

CMD ["bun", "run", "start"]
EXPOSE 4000
