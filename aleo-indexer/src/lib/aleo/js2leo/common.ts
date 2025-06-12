import {
  leoAddressSchema,
  LeoAddress,
  leoScalarSchema,
  LeoScalar,
  LeoField,
  leoFieldSchema,
  leoBooleanSchema,
  leoU8Schema,
  LeoU8,
  leoU16Schema,
  LeoU16,
  leoU32Schema,
  LeoU32,
  leoU64Schema,
  LeoU64,
  leoU128Schema,
  LeoU128,
  leoGroupSchema,
  LeoGroup,
  LeoSignature,
  leoSignatureSchema
} from '../types/leo-types.js';

// Leo Type Converter
export const field = (value: bigint): LeoField => {
  const parsed = value + 'field';
  return leoFieldSchema.parse(parsed);
};

export const scalar = (value: bigint): LeoScalar => {
  const parsed = value + 'scalar';
  return leoScalarSchema.parse(parsed);
};

export const group = (value: bigint): LeoGroup => {
  const parsed = value + 'group';
  return leoGroupSchema.parse(parsed);
};

export const u8 = (value: number): LeoU8 => {
  if (isNaN(value)) throw new Error('u8 parsing failed');
  if (value < 0 || value > (1 << 8) - 1)
    throw new Error('Exceed max uint8 value: ' + value);
  const parsed = value + 'u8';
  return leoU8Schema.parse(parsed);
};

export const u16 = (value: number): LeoU16 => {
  if (isNaN(value)) throw new Error('u16 parsing failed');
  if (value < 0 || value > (1 << 16) - 1)
    throw new Error('Exceed max uint16 value: ' + value);
  const parsed = value + 'u16';
  return leoU16Schema.parse(parsed);
};

const U32_MAX = 4294967295;
export const u32 = (value: number): LeoU32 => {
  if (isNaN(value)) throw new Error('u32 parsing failed');
  if (value < 0 || value > U32_MAX)
    throw new Error('Exceed max uint32 value: ' + value);
  const parsed = value + 'u32';
  return leoU32Schema.parse(parsed);
};

export const u64 = (value: bigint): LeoU64 => {
  const parsed = value + 'u64';
  return leoU64Schema.parse(parsed);
};

export const u128 = (value: bigint): LeoU128 => {
  if (!value) throw new Error('u128 parsing failed');
  const parsed = value + 'u128';
  return leoU128Schema.parse(parsed);
};

export const i8 = (value: number): LeoU8 => {
  if (isNaN(value)) throw new Error('u8 parsing failed');
  const parsed = value + 'i8';
  return leoU8Schema.parse(parsed);
};

export const i16 = (value: number): LeoU16 => {
  if (isNaN(value)) throw new Error('u16 parsing failed');
  const parsed = value + 'i16';
  return leoU16Schema.parse(parsed);
};

export const i32 = (value: number): LeoU32 => {
  if (isNaN(value)) throw new Error('u32 parsing failed');
  const parsed = value + 'i32';
  return leoU32Schema.parse(parsed);
};

export const i64 = (value: bigint): LeoU64 => {
  const parsed = value + 'i64';
  return leoU64Schema.parse(parsed);
};

export const i128 = (value: bigint): LeoU128 => {
  if (!value) throw new Error('u128 parsing failed');
  const parsed = value + 'i128';
  return leoU128Schema.parse(parsed);
};

export const boolean = (value: boolean): LeoU128 => {
  const val = value ? 'true' : 'false';
  return leoBooleanSchema.parse(val);
};

export const address = (value: string): LeoAddress => {
  return leoAddressSchema.parse(value);
};

export const signature = (value: string): LeoSignature => {
  return leoSignatureSchema.parse(value);
};

export const privateField = (value: string): string => {
  return value.concat('.private');
};

export const publicField = (value: string): string => {
  return value.concat('.public');
};

export const json = (value: any): string => {
  return JSON.stringify(value).replace(/\"/g, '');
};

export const array = (value: any, converterFn: (value: any) => any): any => {
  let result: any[] = [];

  if (Array.isArray(value)) {
    result = value.map((v: any) => array(v, converterFn));
  } else {
    return converterFn(value);
  }
  return result;
};

export const arr2string = (arr: Array<any>): string => {
  let arrString = `[`;
  arrString += arr.map((v) => (Array.isArray(v) ? arr2string(v) : v)).join(',');
  arrString += ']';
  return arrString;
};
const ALEO_ARR_SIZE = 32;
const EVM_ADDR_SIZE = 20;
export const evm2AleoArr = (evmAddr: string) => {
  // TODO: verify valid EthAddress
  // if (evmAddr.length != 22)  {
  //   throw Error("EVM address must have size 20 bytes");
  // }
  const hexArray = evmAddr.slice(2, evmAddr.length).match(/.{2}/g);
  if (!hexArray) return [];
  const paddedHexArray = [
    ...Array(ALEO_ARR_SIZE - hexArray.length).fill('00'),
    ...hexArray
  ];
  const paddedDecimalArray = paddedHexArray.map((hex) => parseInt(hex, 16));
  return paddedDecimalArray;
};

export const object2struct = <
  T extends Record<string, any>,
  R extends Record<keyof T, any>
>(
  obj: T,
  fns: Function[]
): R => {
  return Object.entries(obj).reduce(
    (acc, [key, value], index) => ({
      ...acc,
      [key]: fns[index](value)
    }),
    {} as R
  );
};
