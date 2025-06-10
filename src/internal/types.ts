export const createConfig = <T extends Record<string, any>>(config: T): T => config;

export interface ProgramFunctionConfig {
  name: string;
  tableName: string;
  fields: { [rpcField: string]: string }; // Mapping from RPC field name to DB field name
}

export interface ProgramConfig {
  programName: string;
  functions: ProgramFunctionConfig[];
  mappings?: { name: string; tableName: string }[]; // Optional mappings for additional tables
}

export function defineProgram(config: ProgramConfig): ProgramConfig {
  return config;
}

// Helper function for safe nested property access
export function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}