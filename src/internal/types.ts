// Helper function for type inference in indexer.config.ts
export const createConfig = <T extends Record<string, any>>(config: T): T => config;