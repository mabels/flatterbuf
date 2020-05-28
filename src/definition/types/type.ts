import { Option } from '../optional';
import { Definition as Boolean } from './boolean';
import { Definition as Char } from './char';
import { Definition as FixedCString } from './fixed-cstring';
import { Definition as FixedArray } from './fixed-array';
import { Definition as BitStruct } from './bit-struct';
import { Definition as Struct } from './struct';
import { Definition as Uint8 } from './uint8';
import { Definition as Uint16 } from './uint16';
import { Definition as Short } from './short';
import { Definition as Uint32 } from './uint32';
import { Definition as Int } from './int';
import { Definition as Float } from './float';
import { Definition as Double } from './double';
import { Definition as Long } from './long';
import { Definition as Uint64 } from './uint64';

export type TypeName =
  | 'Boolean'
  | 'Uint8'
  | 'Char'
  | 'Uint16'
  | 'Short'
  | 'Uint32'
  | 'Int'
  | 'Float'
  | 'Uint64'
  | 'Long'
  | 'Double'
  | 'FixedArray'
  | 'FixedCString'
  | 'Struct'
  | 'BitStruct';

export type FilterFunc<T> = (val: T | undefined) => Option<T>;
export type CreateFunc<T> = (...vals: Partial<T>[]) => T;

export interface Definition<T> {
  readonly type: TypeName;
  readonly bytes: number;
  // readonly initial: T;
  readonly givenInitial: Option<unknown>;
  coerce(val: unknown): Option<unknown>;
  create(...vals: (undefined | T | Partial<T>)[]): T;
}
export type Type<T> = Definition<T>;

export interface ScalarTypeArg<T> {
  readonly initial?: T;
}

export interface NamedType<T> extends Definition<T> {
  readonly name: string;
}

export type ScalarTypes =
  | Boolean
  | Uint8
  | Char
  | Uint16
  | Short
  | Uint32
  | Int
  | Float
  | Uint64
  | Long
  | Double;

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

export function isScalar<T>(def: Definition<T>): boolean {
  return !!ScalarTypesList.find((i) => def.type === i.type);
}

export function isBitStruct(def: Definition<unknown>): def is BitStruct {
  return def.type === BitStruct.type;
}

export function isFixedCString(def: Definition<unknown>): def is FixedCString {
  return def.type === FixedCString.type;
}

export function isHighLow(def: Definition<unknown>): def is Long {
  return def.type === Long.type || def.type === Uint64.type;
}

export function isFixedArray<T>(def: Definition<T>): boolean {
  return def.type === FixedArray.type;
}
export function isStruct<T>(def: Definition<T>): boolean {
  return def.type === Struct.type;
}
export enum AttributeType {
  Scalar,
  FixedArray,
  Struct,
}
export function toAttributeType<T>(def: Definition<T>) {
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
