import { Hono } from 'hono';
import { createYoga } from 'graphql-yoga';
import { createSchema } from 'graphql-yoga';
import { readFileSync } from 'node:fs'; 
import path from 'node:path';           
import { fileURLToPath } from 'node:url';
import { db } from '../database/db.js';
import { tables } from '../database/schema.js';
import { runIndexer } from '../indexing/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const typeDefs = readFileSync(path.join(__dirname, 'schema.graphql'), 'utf-8');

const resolvers = {
  Query: {
    transactions: async () => {
      return await db.select().from(tables.transactions).orderBy(tables.transactions.blockHeight).limit(100);
    },
  },
};

const app = new Hono();

const yoga = createYoga({
  schema: createSchema({
    typeDefs,
    resolvers,
  }),
  graphiql: true,
});

app.use('/graphql', (c) => yoga({ request: c.req.raw }));

// Start the background indexer
runIndexer();

export default {
  fetch: app.fetch,
  port: 4000,
}

// serve({
  // fetch: app.fetch,
  // port: 4000,
// }, (info) => {
//     logger.info({ service: 'server', msg: `🚀 GraphQL Server ready at http://localhost:${info.port}/graphql`});
// });