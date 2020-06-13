export * as Base from './base';

export * as Boolean from './boolean';

export * as Char from './char';
export * as Uint8 from './uint8';
export * as Uint16 from './uint16';
export * as Short from './short';
export * as Uint32 from './uint32';
export * as Int from './int';
export * as Float from './float';
export * as Double from './double';
export * as Long from './long';
export * as Uint64 from './uint64';
export * as HighLow from './high-low';

export * as FixedCString from './fixed-cstring';
export * as FixedArray from './fixed-array';
export * as BitStruct from './bit-struct';
export * as Struct from './struct';

import { Definition as Base } from './base';
import { Definition as Boolean } from './boolean';
import { Definition as Uint8 } from './uint8';
import { Definition as Uint16 } from './uint16';
import { Definition as Uint32 } from './uint32';
import { Definition as Char } from './char';
import { Definition as Short } from './short';
import { Definition as Int } from './int';
import { Definition as Double } from './double';
import { Definition as Float } from './float';
import { Definition as Uint64 } from './uint64';
import { Definition as Long } from './long';

import { Definition as FixedArray } from './fixed-array';
import { Definition as FixedCString } from './fixed-cstring';
import { Definition as BitStruct } from './bit-struct';
import { Definition as Struct } from './struct';
// import { Definition as Boolean } from './boolean';
// import { Definition as Boolean } from './boolean';
// import { Definition as Boolean } from './boolean';
export type JSScalarTypes =
    Boolean |
    Uint8 |
    Char |
    Uint16 |
    Short |
    Uint32 |
    Int |
    Float |
    Double;

export type ScalarTypes = JSScalarTypes | Uint64 | Long;

export const SimpleScalarTypesList = [
  Boolean,
  Uint8,
  Char,
  Uint16,
  Short,
  Uint32,
  Int,
  Float,
  Uint64,
  Long,
  Double,
];

export const ScalarTypesList = [...SimpleScalarTypesList, FixedCString, BitStruct];

export function isScalar<T>(def: Base<T>): boolean {
  return !!ScalarTypesList.find((i) => def.type === i.type);
}

export function isBitStruct(def: Base<unknown>): def is BitStruct {
  return def.type === BitStruct.type;
}

export function isFixedCString(def: Base<unknown>): def is FixedCString {
  return def.type === FixedCString.type;
}

export function isHighLow(def: Base<unknown>): def is Long {
  return def.type === Long.type || def.type === Uint64.type;
}

export function isFixedArray<T>(def: Base<T>): boolean {
  return def.type === FixedArray.type;
}
export function isStruct<T>(def: Base<T>): boolean {
  return def.type === Struct.type;
}
export enum AttributeType {
  Scalar,
  FixedArray,
  Struct,
}
export function toAttributeType<T>(def: Base<T>) {
  if (isScalar(def)) {
    return AttributeType.Scalar;
  }
  if (isFixedArray(def)) {
    return AttributeType.FixedArray;
  }
  if (isStruct(def)) {
    return AttributeType.Struct;
  }
  throw Error(`Unknown type: ${def.type}`);
}
