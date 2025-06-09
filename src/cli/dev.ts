import { createServer as createViteServer } from "vite";
import { ViteNodeRunner } from "vite-node/client";
import { logger } from "../internal/logger.js";

export async function dev() {
  logger.info({service: 'dev', msg: "Starting development server..."});

  const server = await createViteServer({
    server: {
      // Configure server options if needed, though we run it programmatically
    },
  });
  await server.pluginContainer.buildStart({});

  const node = new ViteNodeRunner({
    root: server.config.root,
    base: server.config.base,
    fetchModule(id) {
      return server.ssrFetchModule(id);
    },
    resolveId(id, importer) {
      return server.pluginContainer.resolveId(id, importer);
    },
  });

  // This is where we will start our application logic
  // The `executeFile` will run our main logic, and Vite will handle re-execution on change.
  async function startApp() {
    try {
      logger.info({ service: 'dev', msg: "Starting application..." });
      await node.executeFile("./src/server/index.ts");
    } catch (error: Error | any) {
      logger.error({msg: "Failed to start application", service: 'dev', error});
      process.exit(1);
    }
  }

  // Watch for changes and restart
  server.watcher.on("change", async (path) => {
    if (path.includes("src/") || path.includes("indexer.config.ts")) {
      logger.info({msg: `File changed: ${path}. Restarting...`, service: 'dev'});
      await node.executeFile("./src/server/index.ts");
    }
  });

  await startApp();
}