export interface ProgramFunctionConfig {
  name: string;
  tableName: string;
  fields: { [rpcField: string]: string }; // Mapping from RPC field name to DB field name
}

export interface ProgramConfig {
  programId: string;
  functions: ProgramFunctionConfig[];
}

export function defineProgram(config: ProgramConfig): ProgramConfig {
  return config;
}