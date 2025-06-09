import os from "node:os";
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  ssr: {
    noExternal: ["pino-pretty"],
  },
  build: {
    target: "node22",
    rollupOptions: {
      external: [
        'async_hooks',
        'path',
        'fs',  
        'url', 
        'p-limit',
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globalSetup: ["src/_test/globalSetup.ts"],
    setupFiles: ["src/_test/setup.ts"],
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 1,
      },
    },
    sequence: { hooks: "stack" },
    testTimeout: os.platform() === "win32" ? 30_000 : 10_000,
  },
});
