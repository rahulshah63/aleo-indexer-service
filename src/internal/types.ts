export const createConfig = <T extends Record<string, any>>(config: T): T => config;

export interface ProgramFunctionConfig {
  name: string;
  tableName: string;
  fields: { [rpcField: string]: string }; // Mapping from RPC field name to DB field name
}

export interface ProgramConfig {
  programName: string;
  functions: ProgramFunctionConfig[];
}

export function defineProgram(config: ProgramConfig): ProgramConfig {
  return config;
}