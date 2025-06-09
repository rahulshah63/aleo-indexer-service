import { createViteNodeServer } from "vite-node/server";
import { createServer as createViteServer } from "vite";
import { ViteNodeRunner } from "vite-node/client";
import { logger } from "../internal/logger.js";

export async function dev() {
  logger.info("Starting development server...");

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
      logger.info("Starting services...");
      await node.executeFile("./src/server/index.ts");
    } catch (error) {
      logger.error({ err: error }, "Failed to start services");
      process.exit(1);
    }
  }

  // Watch for changes and restart
  server.watcher.on("change", async (path) => {
    if (path.includes("src/") || path.includes("indexer.config.ts")) {
      logger.info(`File changed: ${path}. Restarting...`);
      await node.executeFile("./src/server/index.ts");
    }
  });

  await startApp();
}