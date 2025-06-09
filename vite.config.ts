import { defineConfig } from "vite"; 
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    nodePolyfills(),
  ],
  ssr: {
    target: "node",
    external: [
      'async_hooks',
      'p-limit', 
    ],
  },
  build: {
    ssr: true,
    rollupOptions: {
      external: [
        'async_hooks',
        'p-limit',
        'node:async_hooks',
        'node:path',
        'node:fs',
        'node:url',
        'node:os',
      ],
      output: {
        format: "esm",
        inlineDynamicImports: false,
      },
    },
  },
  optimizeDeps: {
    exclude: [
      "p-limit",
      "async_hooks",
      "node:async_hooks",
    ],
    esbuildOptions: {
      target: "node22",
    },
  },
});