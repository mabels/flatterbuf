import { Runtime } from '../runtime';

export namespace Definition {
  export namespace Align {
    export type Func = (a: number) => number;

    export function Byte(a: number) {
      return a;
    }
    export function TwoByte(a: number) {
      return a + (a % 2);
    }
    export function FourByte(a: number) {
      return a + (a % 4);
    }
    export function EightByte(a: number) {
      return a + (a % 8);
    }
    export const Functions: { [id: string]: Func } = {
        byte: Byte,
        twobyte: TwoByte,
        fourbyte: FourByte,
        EightByte: EightByte
    };

    export function funcMapper(name?: string): {name: string, func: Func } {
      const fname = (name || '').toLowerCase();
      const fn = Functions[fname];
      if (fn) {
        return { name: fname, func: fn };
      }
      return { name: 'byte', func: Byte };
    }

    export function funcName(name?: string): string {
      return funcMapper(name).name;
    }

    export function func(name?: string): Func {
      return funcMapper(name).func;
    }
  }

  export namespace Types {
    export type TypeName  = 'Boolean'
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

    export interface Type {
      readonly type: TypeName;
      readonly bytes: number;
      // readonly notRequire: boolean;
    }

    export interface ScalarType<T> extends Type {
      readonly initial: T;
    }

    export interface ScalarTypeArg<T> {
      readonly initial?: T;
      // readonly notRequire?: boolean;
    }

    export class Boolean implements ScalarType<boolean> {
      public static readonly type: TypeName = 'Boolean';
      public readonly type = Boolean.type;
      public static readonly bytes = 1;
      public readonly bytes = Boolean.bytes;
      // public readonly notRequire: boolean;
      public readonly initial: boolean;
      public constructor(arg: ScalarTypeArg<boolean> = { initial: false }) {
        this.initial = !!arg.initial;
      }
    }
    export class Uint8 implements ScalarType<number> {
      public static readonly type: TypeName = 'Uint8';
      public readonly type = Uint8.type;
      public static readonly bytes = 1;
      public readonly bytes = Uint8.bytes;
      // public readonly notRequire: boolean;
      public readonly initial: number;
      public constructor(arg: ScalarTypeArg<number> = { initial: 0 }) {
        this.initial = ~~arg.initial;
      }
    }
    export class Char implements ScalarType<string> {
      public static readonly type: TypeName = 'Char';
      public readonly type = Char.type;
      public static readonly bytes = 1;
      public readonly bytes = Char.bytes;
      // public readonly notRequire: boolean;
      public readonly initial: string;
      public constructor(arg: ScalarTypeArg<string> = { initial: ' ' }) {
        this.initial = (arg.initial || ' ').substr(0, 1);
      }
    }
    export class Uint16 implements ScalarType<number> {
      public static readonly type: TypeName = 'Uint16';
      public readonly type = Uint16.type;
      public static readonly bytes = 2;
      public readonly bytes = Uint16.bytes;
      // public readonly notRequire: boolean;
      public readonly initial: number;
      public constructor(arg: ScalarTypeArg<number> = { initial: 0 }) {
        this.initial = ~~arg.initial;
      }
    }
    export class Short implements ScalarType<number> {
      public static readonly type: TypeName = 'Short';
      public readonly type = Short.type;
      public static readonly bytes = 2;
      public readonly bytes = Short.bytes;
      // public readonly notRequire: boolean;
      public readonly initial: number;
      public constructor(arg: ScalarTypeArg<number> = { initial: 0 }) {
        this.initial = ~~arg.initial;
      }
    }
    export class Uint32 implements ScalarType<number> {
      public static readonly type: TypeName = 'Uint32';
      public readonly type = Uint32.type;
      public static readonly bytes = 4;
      public readonly bytes = Uint32.bytes;
      // public readonly notRequire: boolean;
      public readonly initial: number;
      public constructor(arg: ScalarTypeArg<number> = { initial: 0 }) {
        this.initial = ~~arg.initial;
      }
    }
    export class Int implements ScalarType<number> {
      public static readonly type: TypeName = 'Int';
      public readonly type = Int.type;
      public static readonly bytes = 4;
      public readonly bytes = Int.bytes;
      // public readonly notRequire: boolean;
      public readonly initial: number;
      public constructor(arg: ScalarTypeArg<number> = { initial: 0 }) {
        this.initial = ~~arg.initial;
      }
    }
    export class Float implements ScalarType<number> {
      public static readonly type: TypeName = 'Float';
      public readonly type = Float.type;
      public static readonly bytes = 4;
      public readonly bytes = Float.bytes;
      // public readonly notRequire: boolean;
      public readonly initial: number;
      public constructor(arg: ScalarTypeArg<number> = { initial: 0 }) {
        this.initial = ~~arg.initial;
      }
    }
    export class Uint64 implements ScalarType<Runtime.Types.HighLow.Type> {
      public static readonly type: TypeName = 'Uint64';
      public readonly type = Uint64.type;
      public static readonly bytes = 8;
      public readonly bytes = Uint64.bytes;
      // public readonly notRequire: boolean;
      public readonly initial: Runtime.Types.HighLow.Type;
      public constructor(arg: ScalarTypeArg<Runtime.Types.HighLow.Type> = { initial: Runtime.Types.HighLow.defaultValue }) {
        this.initial = Runtime.Types.HighLow.create(arg.initial);
      }
    }
    export class Long implements ScalarType<Runtime.Types.HighLow.Type> {
      public static readonly type: TypeName = 'Long';
      public readonly type = Long.type;
      public static readonly bytes = 8;
      public readonly bytes = Long.bytes;
      // public readonly notRequire: boolean;
      public readonly initial: Runtime.Types.HighLow.Type;
      public constructor(arg: ScalarTypeArg<Runtime.Types.HighLow.Type> = { initial: Runtime.Types.HighLow.defaultValue }) {
        this.initial = Runtime.Types.HighLow.create(arg.initial)
      }
    }
    export class Double implements ScalarType<number> {
      public static readonly type: TypeName = 'Double';
      public readonly type = Double.type;
      public static readonly bytes = 8;
      public readonly bytes = Double.bytes;
      // public readonly notRequire: boolean;
      public readonly initial: number;
      public constructor(arg: ScalarTypeArg<number> = { initial: 0 }) {
        this.initial = ~~arg.initial;
      }
    }

    export interface AlignType extends Type {
      readonly alignFuncName: string;
    }

    export interface FixedArrayArg {
      readonly length: number;
      readonly element: Type;
      readonly alignFuncName?: string;
    }

    export class FixedArray implements AlignType {
      public static readonly type: TypeName = 'FixedArray';
      public readonly type = FixedArray.type;
      public readonly bytes: number;
      public readonly length: number;
      public readonly element: Type;
      // public readonly notRequire: boolean;
      public readonly alignFuncName: string;
      public constructor(el: FixedArrayArg) {
        this.length = el.length;
        const al = Align.funcMapper(el.alignFuncName);
        this.alignFuncName = al.name;
        this.bytes = el.length * al.func(el.element.bytes);
        this.element = el.element;
      }
    }

    export interface StructAttribute {
      readonly name: string;
      readonly notRequired?: boolean;
      readonly type: Type;
    }

    export interface StructAttributeOfs extends StructAttribute {
      readonly notRequired: boolean;
      readonly ofs: number;
    }

    export interface StructArg {
      readonly name: string;
      readonly alignFuncName?: string;
      // readonly notRequired?: boolean;
      readonly attributes: StructAttribute[];
    }
    export class Struct implements AlignType {
      public static readonly type: TypeName = 'Struct';
      public readonly type = Struct.type;
      public readonly bytes: number;
      public readonly name: string;
      public readonly alignFuncName: string;
      public readonly attributes: StructAttributeOfs[];
      // public readonly notRequire: boolean;
      public constructor(st: StructArg) {
        this.name = st.name;
        // this.notRequire = !!st.notRequired;
        const al = Align.funcMapper(st.alignFuncName);
        this.alignFuncName = al.name;
        const tmp = st.attributes.reduce((res, attr) => {
          res.attributesInclOfs.push({
            ...attr,
            notRequired: !!attr.notRequired,
            ofs: res.bytes
          });
          res.bytes = res.bytes + al.func(attr.type.bytes);
          return res;
        }, {
          bytes: 0,
          attributesInclOfs: [] as StructAttributeOfs[]
        });
        this.bytes = tmp.bytes;
        this.attributes = tmp.attributesInclOfs;
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
    export enum AttributeType {
      Scalar,
      FixedArray,
      Struct
    };
    export function toAttributeType(def: Type) {
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
  }
}
