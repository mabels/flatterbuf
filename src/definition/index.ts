import { Runtime } from '../runtime';

export namespace Definition {
  export namespace Align {
    export function Null(a: number) {
      return a;
    }
  }

  export namespace Types {
    export interface Type {
      readonly type:
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
        | 'Struct';
      readonly bytes: number;
      readonly require: boolean;
    }

    export interface ScalarType<T> extends Type {
      readonly initial: T;
    }

    export interface ScalarTypeArg<T> {
      readonly initial?: T;
      readonly notRequire?: boolean;
    }

    export class Boolean implements ScalarType<boolean> {
      public static readonly type = 'Boolean';
      public readonly type = Boolean.type;
      public static readonly bytes = 1;
      public readonly bytes = Boolean.bytes;
      public readonly require: boolean;
      public readonly initial: boolean;
      public constructor(arg: ScalarTypeArg<boolean> = { initial: false }) {
        this.require = !!arg.notRequire;
        this.initial = !!arg.initial;
      }
    }
    export class Uint8 implements ScalarType<number> {
      public static readonly type = 'Uint8';
      public readonly type = Uint8.type;
      public static readonly bytes = 1;
      public readonly bytes = Uint8.bytes;
      public readonly require: boolean;
      public readonly initial: number;
      public constructor(arg: ScalarTypeArg<number> = { initial: 0 }) {
        this.require = !!arg.notRequire;
        this.initial = ~~arg.initial;
      }
    }
    export class Char implements ScalarType<number> {
      public static readonly type = 'Char';
      public readonly type = Char.type;
      public static readonly bytes = 1;
      public readonly bytes = Char.bytes;
      public readonly require: boolean;
      public readonly initial: number;
      public constructor(arg: ScalarTypeArg<number> = { initial: 0 }) {
        this.require = !!arg.notRequire;
        this.initial = ~~arg.initial;
      }
    }
    export class Uint16 implements ScalarType<number> {
      public static readonly type = 'Uint16';
      public readonly type = Uint16.type;
      public static readonly bytes = 2;
      public readonly bytes = Uint16.bytes;
      public readonly require: boolean;
      public readonly initial: number;
      public constructor(arg: ScalarTypeArg<number> = { initial: 0 }) {
        this.require = !!arg.notRequire;
        this.initial = ~~arg.initial;
      }
    }
    export class Short implements ScalarType<number> {
      public static readonly type = 'Short';
      public readonly type = Short.type;
      public static readonly bytes = 2;
      public readonly bytes = Short.bytes;
      public readonly require: boolean;
      public readonly initial: number;
      public constructor(arg: ScalarTypeArg<number> = { initial: 0 }) {
        this.require = !!arg.notRequire;
        this.initial = ~~arg.initial;
      }
    }
    export class Uint32 implements ScalarType<number> {
      public static readonly type = 'Uint32';
      public readonly type = Uint32.type;
      public static readonly bytes = 4;
      public readonly bytes = Uint32.bytes;
      public readonly require: boolean;
      public readonly initial: number;
      public constructor(arg: ScalarTypeArg<number> = { initial: 0 }) {
        this.require = !!arg.notRequire;
        this.initial = ~~arg.initial;
      }
    }
    export class Int implements ScalarType<number> {
      public static readonly type = 'Int';
      public readonly type = Int.type;
      public static readonly bytes = 4;
      public readonly bytes = Int.bytes;
      public readonly require: boolean;
      public readonly initial: number;
      public constructor(arg: ScalarTypeArg<number> = { initial: 0 }) {
        this.require = !!arg.notRequire;
        this.initial = ~~arg.initial;
      }
    }
    export class Float implements ScalarType<number> {
      public static readonly type = 'Float';
      public readonly type = Float.type;
      public static readonly bytes = 4;
      public readonly bytes = Float.bytes;
      public readonly require: boolean;
      public readonly initial: number;
      public constructor(arg: ScalarTypeArg<number> = { initial: 0 }) {
        this.require = !!arg.notRequire;
        this.initial = ~~arg.initial;
      }
    }
    export class Uint64 implements ScalarType<Runtime.HighLow.Type> {
      public static readonly type = 'Uint64';
      public readonly type = Uint64.type;
      public static readonly bytes = 8;
      public readonly bytes = Uint64.bytes;
      public readonly require: boolean;
      public readonly initial: Runtime.HighLow.Type;
      public constructor(arg: ScalarTypeArg<Runtime.HighLow.Type> = { initial: Runtime.HighLow.defaultValue }) {
        this.require = !!arg.notRequire;
        this.initial = Runtime.HighLow.create(arg.initial);
      }
    }
    export class Long implements ScalarType<Runtime.HighLow.Type> {
      public static readonly type = 'Long';
      public readonly type = Long.type;
      public static readonly bytes = 8;
      public readonly bytes = Long.bytes;
      public readonly require: boolean;
      public readonly initial: Runtime.HighLow.Type;
      public constructor(arg: ScalarTypeArg<Runtime.HighLow.Type> = { initial: Runtime.HighLow.defaultValue }) {
        this.require = !!arg.notRequire;
        this.initial = Runtime.HighLow.create(arg.initial)
      }
    }
    export class Double implements ScalarType<number> {
      public static readonly type = 'Double';
      public readonly type = Double.type;
      public static readonly bytes = 8;
      public readonly bytes = Double.bytes;
      public readonly require: boolean;
      public readonly initial: number;
      public constructor(arg: ScalarTypeArg<number> = { initial: 0 }) {
        this.require = !!arg.notRequire;
        this.initial = ~~arg.initial;
      }
    }
    export interface FixedArrayArg {
      readonly length: number;
      readonly element: Type;
      readonly require?: boolean;
    }
    export class FixedArray implements Type {
      public static readonly type = 'FixedArray';
      public readonly type = FixedArray.type;
      public readonly bytes: number;
      public readonly length: number;
      public readonly element: Type;
      public readonly require: boolean;
      public constructor(el: FixedArrayArg, align = Align.Null) {
        this.length = el.length;
        this.bytes = el.length * align(el.element.bytes);
        this.element = el.element;
        this.require = !!el.require;
      }
    }

    export interface StructAttribute {
      readonly name: string;
      type: Type;
    }

    export interface StructArg {
      readonly name: string;
      readonly attributes: StructAttribute[];
      readonly require?: boolean;
    }
    export class Struct implements Type {
      public static readonly type = 'Struct';
      public readonly type = Struct.type;
      public readonly bytes: number;
      public readonly name: string;
      public readonly attributes: StructAttribute[];
      public readonly require: boolean;
      public constructor(st: StructArg, align = Align.Null) {
        this.bytes = st.attributes.reduce((p, { type }) => p + align(type.bytes), 0);
        this.name = st.name;
        this.attributes = st.attributes;
        this.require = !!st.require;
      }
    }
    export type ScalarTypes =
      | Types.Boolean
      | Types.Uint8
      | Types.Char
      | Types.Uint16
      | Types.Short
      | Types.Uint32
      | Types.Int
      | Types.Float
      | Types.Uint64
      | Types.Long
      | Types.Double;

    export const ScalarTypesList = [
      Types.Boolean,
      Types.Uint8,
      Types.Char,
      Types.Uint16,
      Types.Short,
      Types.Uint32,
      Types.Int,
      Types.Float,
      Types.Uint64,
      Types.Long,
      Types.Double
    ];
    export function isScalar(def: Type): boolean {
      return !!ScalarTypesList.find(i => def.type === i.type);
    }
    export function isFixedArray(def: Type): boolean {
      return def.type === FixedArray.type;
    }
    export function isStruct(def: Type): boolean {
      return def.type === Struct.type;
    }
  }
}
