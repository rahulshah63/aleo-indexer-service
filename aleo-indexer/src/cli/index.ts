// aleo-indexer/src/cli/index.ts

import { Command } from 'commander';
import { resolve } from 'path';
import { spawn } from 'child_process';
// import { fileURLToPath } from 'url';
// import path from 'path';
import 'dotenv/config'; // Load environment variables from .env file

import { startIndexer } from '../core/indexer.js';
import { generateSchemas } from './generate.js';
import { initializeGraphQLServer } from '../server/index.js';
import { logger } from '../utils/logger.js';

// Get __dirname equivalent for ES Modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

const program = new Command();

program
  .name('aleo-indexer')
  .description('CLI for managing your Aleo Indexer project')
  .version('0.1.0');

program
  .command('dev')
  .description('Starts the development server with hot-reloading')
  .action(async () => {
    logger.info(`Starting Aleo Indexer in development mode... Executing from: ${__filename}`);

    // Load indexer.config.ts dynamically from the current working directory
    const configPath = resolve(process.cwd(), 'indexer.config.ts');
    let config;
    try {
        config = (await import(configPath)).default;
    } catch (e) {
        logger.error(`Failed to load indexer.config.ts from ${configPath}. Please ensure it exists and is correctly configured.`);
        logger.error(e);
        process.exit(1);
    }
    
    // Ensure DATABASE_URL is set for Drizzle
    if (!process.env.DATABASE_URL) {
      logger.error('DATABASE_URL environment variable is not set. Please set it in your .env file.');
      process.exit(1);
    }

    // Generate schema (ensure latest Drizzle and GraphQL schemas are present)
    logger.info('Generating Drizzle and GraphQL schemas...');
    try {
      await generateSchemas(config);
      logger.info('Schemas generated successfully.');
    } catch (e) {
      logger.error('Error generating schemas:', e);
      process.exit(1);
    }

    // Run Drizzle migrations
    logger.info('Running Drizzle migrations...');
    await new Promise<void>((resolve, reject) => {
        const drizzleMigrate = spawn('bun', ['x', 'drizzle-kit', 'migrate'], {
            stdio: 'inherit',
            cwd: process.cwd(), // Execute in the user's project directory
            env: { ...process.env, DRISSEL_DRIVER: 'pg' }, // Ensure drizzle-kit picks up the PG driver
        });
        drizzleMigrate.on('close', (code) => {
            if (code === 0) {
                logger.info('Drizzle migrations applied.');
                resolve();
            } else {
                logger.error(`Drizzle migrations failed with code ${code}`);
                reject(new Error('Drizzle migrations failed.'));
            }
        });
    }).catch(e => {
        logger.error(e.message);
        process.exit(1);
    });

    // Dynamically import Drizzle DB connection and schema
    // Assuming the example project will have its db and schema setup in `drizzle/index.ts`
    const dbPath = resolve(process.cwd(), 'drizzle', 'index.ts');
    let dbInstance: any;
    let generatedSchema: any;
    try {
      const drizzleModule = await import(dbPath);
      dbInstance = drizzleModule.db;
      generatedSchema = drizzleModule.schema; // This should contain all generated tables
      if (!dbInstance || !generatedSchema || !generatedSchema.indexerState || !generatedSchema.transactions) {
        throw new Error("Missing 'db' or 'schema' exports from drizzle/index.ts, or missing base tables in schema.");
      }
    } catch (e) {
      logger.error(`Failed to load Drizzle DB and schema from ${dbPath}. Ensure it exists and exports 'db' and 'schema'.`);
      logger.error(e);
      process.exit(1);
    }

    // Start the indexer in a background task
    startIndexer(config, dbInstance, generatedSchema).catch(e => {
      logger.error('Indexer failed to start:', e);
      // Do not exit, server might still be useful for existing data
    });

    // Initialize and start the GraphQL server using Hono and Bun.serve
    const graphQLSchemaPath = resolve(process.cwd(), 'schema.graphql');
    let app;
    try {
        app = await initializeGraphQLServer(dbInstance, generatedSchema, graphQLSchemaPath);
    } catch (e) {
        logger.error('Failed to initialize GraphQL server:', e);
        process.exit(1);
    }
    
    const port = process.env.PORT || 4000;
    // Use Bun's native serve. 'fetch' method is expected by Bun.serve
    // @ts-ignore
    Bun.serve({
      fetch: app.fetch,
      port: port,
    }, (info: any) => {
      logger.info(`🚀 GraphQL Server ready at http://localhost:${info.port}/graphql`);
    });

    logger.info('Development server is running. Press Ctrl+C to stop.');
  });


program
  .command('start')
  .description('Starts the indexer and GraphQL server in production mode')
  .action(async () => {
    logger.info('Starting Aleo Indexer in production mode...');

    // Load indexer.config.ts
    const configPath = resolve(process.cwd(), 'indexer.config.ts');
    let config;
    try {
        config = (await import(configPath)).default;
    } catch (e) {
        logger.error(`Failed to load indexer.config.ts from ${configPath}.`);
        logger.error(e);
        process.exit(1);
    }

    // Ensure DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      logger.error('DATABASE_URL environment variable is not set. Please set it.');
      process.exit(1);
    }

    // Dynamically import Drizzle DB connection and schema
    const dbPath = resolve(process.cwd(), 'drizzle', 'index.ts');
    let dbInstance: any;
    let generatedSchema: any;
    try {
      const drizzleModule = await import(dbPath);
      dbInstance = drizzleModule.db;
      generatedSchema = drizzleModule.schema;
      if (!dbInstance || !generatedSchema || !generatedSchema.indexerState || !generatedSchema.transactions) {
        throw new Error("Missing 'db' or 'schema' exports from drizzle/index.ts, or missing base tables in schema.");
      }
    } catch (e) {
      logger.error(`Failed to load Drizzle DB and schema from ${dbPath}.`);
      logger.error(e);
      process.exit(1);
    }

    // Start the indexer
    startIndexer(config, dbInstance, generatedSchema).catch(e => {
      logger.error('Indexer failed to start:', e);
      // Continue to start server, as it might be useful for existing data
    });

    // Start the GraphQL server
    const graphQLSchemaPath = resolve(process.cwd(), 'schema.graphql');
    let app;
    try {
        app = await initializeGraphQLServer(dbInstance, generatedSchema, graphQLSchemaPath);
    } catch (e) {
        logger.error('Failed to initialize GraphQL server:', e);
        process.exit(1);
    }
    
    logger.info('Starting GraphQL server...');
    const port = process.env.PORT || 4000;
    // @ts-ignore
    Bun.serve({
      fetch: app.fetch,
      port: port,
    }, (info: any) => {
      logger.info(`🚀 GraphQL Server ready at http://localhost:${info.port}/graphql`);
    });

    logger.info('Production server is running. Press Ctrl+C to stop.');
  });

program
  .command('generate')
  .description('Generates Drizzle ORM schema and GraphQL schema from indexer.config.ts')
  .action(async () => {
    logger.info('Generating schemas...');
    const configPath = resolve(process.cwd(), 'indexer.config.ts');
    let config;
    try {
        config = (await import(configPath)).default;
    } catch (e) {
        logger.error(`Failed to load indexer.config.ts from ${configPath}.`);
        logger.error(e);
        process.exit(1);
    }
    try {
      await generateSchemas(config);
      logger.info('Schemas generated successfully.');
    } catch (e) {
      logger.error('Error generating schemas:', e);
      process.exit(1);
    }
  });

program
  .command('migrate')
  .description('Runs Drizzle ORM migrations (generates new migrations or applies pending ones)')
  .option('-g, --generate', 'Generate new migration files based on schema changes')
  .action(async (options) => {
    if (!process.env.DATABASE_URL) {
      logger.error('DATABASE_URL environment variable is not set. Please set it in your .env file.');
      process.exit(1);
    }

    if (options.generate) {
      logger.info('Generating Drizzle migration files...');
      await new Promise<void>((resolve, reject) => {
          const drizzleGenerate = spawn('bun', ['x', 'drizzle-kit', 'generate'], {
              stdio: 'inherit',
              cwd: process.cwd(),
              env: { ...process.env, DRISSEL_DRIVER: 'pg' },
          });
          drizzleGenerate.on('close', (code) => {
              if (code === 0) {
                  logger.info('Drizzle migration files generated.');
                  resolve();
              } else {
                  logger.error(`Drizzle migration generation failed with code ${code}`);
                  reject(new Error('Drizzle migration generation failed.'));
              }
          });
      }).catch(e => {
          logger.error(e.message);
          process.exit(1);
      });
    } else {
      logger.info('Applying Drizzle migrations...');
      await new Promise<void>((resolve, reject) => {
          const drizzleMigrate = spawn('bun', ['x', 'drizzle-kit', 'migrate'], {
              stdio: 'inherit',
              cwd: process.cwd(),
              env: { ...process.env, DRISSEL_DRIVER: 'pg' },
          });
          drizzleMigrate.on('close', (code) => {
              if (code === 0) {
                  logger.info('Drizzle migrations applied.');
                  resolve();
              } else {
                  logger.error(`Drizzle migrations failed with code ${code}`);
                  reject(new Error('Drizzle migrations failed.'));
              }
          });
      }).catch(e => {
          logger.error(e.message);
          process.exit(1);
      });
    }
  });


program.parse(process.argv);