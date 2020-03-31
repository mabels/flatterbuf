import { Runtime } from '../runtime';

export namespace Definition {
  export namespace Align {
    export interface Funcs<A> {
      readonly element: A;
      readonly overall: A;
    }
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

    export interface FuncAndName {
      name: string;
      func: Func;
    }
    export interface FuncNames {
      readonly names: Funcs<string>;
      readonly funcs: Funcs<Func>;
    }

    export function funcsMapper(funcs?: Partial<Funcs<string>>): FuncNames {
      const element = funcMapper((funcs || {}).element);
      const overall = funcMapper((funcs || {}).overall);
      return {
        names: { element: element.name, overall: overall.name },
        funcs: { element: element.func, overall: overall.func }
      };
    }

    export function funcMapper(a?: string): FuncAndName {
      const fname = (a || '').toLowerCase();
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
        | 'FixedCString'
        | 'Struct';

    export interface Type<T> {
      readonly type: TypeName;
      readonly bytes: number;
      readonly initial: T;
    }

    export interface ScalarTypeArg<T> {
      readonly initial?: T;
    }

    export class Boolean implements Type<boolean> {
      public static readonly type: TypeName = 'Boolean';
      public static readonly bytes: number = 1;
      public readonly type: TypeName = Boolean.type;
      public readonly bytes: number = Boolean.bytes;
      // public readonly notRequire: boolean;
      public readonly initial: boolean;
      public constructor(arg: ScalarTypeArg<boolean> = { initial: false }) {
        this.initial = !!arg.initial;
      }
    }
    export class Uint8 implements Type<number> {
      public static readonly type: TypeName = 'Uint8';
      public static readonly bytes: number = 1;
      public readonly type: TypeName = Uint8.type;
      public readonly bytes: number = Uint8.bytes;
      // public readonly notRequire: boolean;
      public readonly initial: number;
      public constructor(arg: ScalarTypeArg<number> = { initial: 0 }) {
        this.initial = ~~arg.initial;
      }
    }
    export type CharInitType = string | number;
    export type CharScalarTypeArg = ScalarTypeArg<CharInitType>;

    export class Char implements Type<number> {
      public static readonly type: TypeName = 'Char';
      // public static readonly initial: 0;
      public static readonly bytes: number = 1;
      public readonly type: TypeName = Char.type;
      public readonly bytes: number = Char.bytes;
      // public readonly notRequire: boolean;
      public readonly initial: number;
      public constructor(arg: CharScalarTypeArg = { initial: 0 }) {
        this.initial = Runtime.Types.Char.create(arg.initial);
        // console.log('Char=', arg, this.initial);
      }
    }
    export class Uint16 implements Type<number> {
      public static readonly type: TypeName = 'Uint16';
      public static readonly bytes: number = 2;
      public readonly type: TypeName = Uint16.type;
      public readonly bytes: number = Uint16.bytes;
      // public readonly notRequire: boolean;
      public readonly initial: number;
      public constructor(arg: ScalarTypeArg<number> = { initial: 0 }) {
        this.initial = ~~arg.initial;
      }
    }
    export class Short implements Type<number> {
      public static readonly type: TypeName = 'Short';
      public static readonly bytes: number = 2;
      public readonly type: TypeName = Short.type;
      public readonly bytes: number = Short.bytes;
      // public readonly notRequire: boolean;
      public readonly initial: number;
      public constructor(arg: ScalarTypeArg<number> = { initial: 0 }) {
        this.initial = ~~arg.initial;
      }
    }
    export class Uint32 implements Type<number> {
      public static readonly type: TypeName = 'Uint32';
      public static readonly bytes: number = 4;
      public readonly type: TypeName = Uint32.type;
      public readonly bytes: number = Uint32.bytes;
      // public readonly notRequire: boolean;
      public readonly initial: number;
      public constructor(arg: ScalarTypeArg<number> = { initial: 0 }) {
        this.initial = ~~arg.initial;
      }
    }
    export class Int implements Type<number> {
      public static readonly type: TypeName = 'Int';
      public static readonly bytes: number = 4;
      public readonly type: TypeName = Int.type;
      public readonly bytes: number = Int.bytes;
      // public readonly notRequire: boolean;
      public readonly initial: number;
      public constructor(arg: ScalarTypeArg<number> = { initial: 0 }) {
        this.initial = ~~arg.initial;
      }
    }
    export class Float implements Type<number> {
      public static readonly type: TypeName = 'Float';
      public static readonly bytes: number = 4;
      public readonly type: TypeName = Float.type;
      public readonly bytes: number = Float.bytes;
      // public readonly notRequire: boolean;
      public readonly initial: number;
      public constructor(arg: ScalarTypeArg<number> = { initial: 0 }) {
        this.initial = arg.initial;
      }
    }
    export class Uint64 implements Type<Runtime.Types.HighLow.Type> {
      public static readonly type: TypeName = 'Uint64';
      public static readonly bytes: number = 8;
      public readonly type: TypeName = Uint64.type;
      public readonly bytes: number = Uint64.bytes;
      // public readonly notRequire: boolean;
      public readonly initial: Runtime.Types.HighLow.Type;
      public constructor(arg: ScalarTypeArg<Runtime.Types.HighLow.Type> = {
        initial: Runtime.Types.HighLow.defaultValue }) {
        this.initial = Runtime.Types.HighLow.create(arg.initial);
      }
    }
    export class Long implements Type<Runtime.Types.HighLow.Type> {
      public static readonly type: TypeName = 'Long';
      public static readonly bytes: number = 8;
      public readonly type: TypeName = Long.type;
      public readonly bytes: number = Long.bytes;
      public readonly initial: Runtime.Types.HighLow.Type;
      public constructor(arg: ScalarTypeArg<Runtime.Types.HighLow.Type> = {
        initial: Runtime.Types.HighLow.defaultValue }) {
        this.initial = Runtime.Types.HighLow.create(arg.initial);
      }
    }
    export class Double implements Type<number> {
      public static readonly type: TypeName = 'Double';
      public static readonly bytes: number = 8;
      public readonly type: TypeName = Double.type;
      public readonly bytes: number = Double.bytes;
      public readonly initial: number;
      public constructor(arg: ScalarTypeArg<number> = { initial: 0 }) {
        this.initial = arg.initial;
      }
    }

    export interface ArrayTypeAttribute<B> extends Type<B[]> {
      readonly element: Type<B>;
      readonly length: number;
    }

    export interface FixedArrayArg<B> {
      readonly element: Type<B>;
      readonly length: number;
      readonly initial?: B[];
      readonly alignFuncs?: Partial<Align.Funcs<string>>;
    }

    export function FixedArraySetupInitial<B>(fa: FixedArray<B>, initial?: B[]): B[] {
      if (fa.element.type === Definition.Types.FixedArray.type) {
        // throw 'Nested not supported';
        return Array(fa.length).fill(FixedArraySetupInitial<B>(fa.element as unknown as FixedArray<B>));
      }
      if (!Array.isArray(initial)) {
        // return [];
        initial = [];
      }
      const ret = Array<B>(fa.length).fill(fa.element.initial);
      const tmp = [...ret];
      for (let i = 0; i < Math.min(fa.length, initial.length); ++i) {
        const val = initial[i];
        if (val !== undefined) {
          ret[i] = val;
        }
      }
      // console.log('FixedArraySetupInitial', tmp, ret, initial);
      return ret;
    }

    export class FixedArray<B> implements ArrayTypeAttribute<B> {
      public static readonly type: TypeName = 'FixedArray';

      public readonly type: TypeName = FixedArray.type;
      public readonly bytes: number;
      public readonly length: number;
      public readonly element: Type<B>;
      public readonly alignFuncs: Align.Funcs<string>;
      public readonly initial: B[];

      public constructor(el: FixedArrayArg<B>) {
        this.length = el.length;
        const al = Align.funcsMapper(el.alignFuncs);
        this.alignFuncs = al.names;
        this.bytes = al.funcs.overall(el.length * al.funcs.element(el.element.bytes));
        this.element = el.element;
        this.initial = FixedArraySetupInitial<B>(this, el.initial);
      }
    }

    export type FixedCStringInitType = string | CharInitType[];
    export interface FixedCStringArg {
      readonly length: number;
      readonly initial?: FixedCStringInitType;
      readonly alignFuncs?: Align.Funcs<string>;
    }

    export function FixedCStringSetupInitial(length: number, ...initials: FixedCStringInitType[]) {
      const ret = Array<number>(length).fill(0);
      initials.reverse().forEach(init => {
          if (typeof init === 'string') {
            const a = Array.from(init.substr(0, length - 1));
            for (let i = Math.min(length - 2, a.length); i >= 0; --i) {
              ret[i] = typeof a[i] === 'string' ? a[i].charCodeAt(0) : 0;
            }
          } else if (Array.isArray(init)) {
            for (let i = Math.min(length - 2, init.length); i >= 0; --i) {
              ret[i] = Runtime.Types.Char.create(init[i]);
            }
          }
        });
      // console.log('FixedCStringSetupInitial', ret, initials);
      return ret;
    }

    export class FixedCString extends FixedArray<number> {
      public static readonly type: TypeName = 'FixedCString';

      public readonly type: TypeName = FixedCString.type;

      constructor(el: FixedCStringArg) {
        super({
          ...el,
          initial: FixedCStringSetupInitial(el.length, el.initial),
          element: new Char()
        });
      }
    }

    export interface StructBaseAttribute {
      readonly name: string;
      readonly notRequired?: boolean;
    }

    export interface StructAttribute<T> extends StructBaseAttribute {
      readonly initial?: T;
      readonly type: Type<T>;
    }

    export interface StructAttributeOfs<T> extends StructAttribute<T> {
      readonly notRequired: boolean;
      readonly ofs: number;
    }

    export interface TypeNameAttribute<T> extends Type<T> {
      readonly name: string;
    }

    export type StructInitial = { [attr: string]: any };

    export interface StructArg {
      readonly name: string;
      readonly alignFuncs?: Partial<Align.Funcs<string>>;
      readonly attributes: StructAttribute<unknown>[];
    }

    export class Struct implements TypeNameAttribute<StructInitial> {
      public static readonly type: TypeName = 'Struct';
      public readonly type: TypeName = Struct.type;
      public readonly bytes: number;
      public readonly name: string;
      public readonly alignFuncs: Align.Funcs<string>;
      public readonly attributes: StructAttributeOfs<any>[];
      public constructor(st: StructArg) {
        this.name = st.name;
        const al = Align.funcsMapper(st.alignFuncs);
        this.alignFuncs = al.names;
        const tmp = st.attributes.reduce((res, attr) => {
          res.attributesInclOfs.push({
            ...attr,
            notRequired: !!attr.notRequired,
            ofs: res.bytes
          });
          res.bytes = res.bytes + al.funcs.element(attr.type.bytes);
          return res;
        }, {
          bytes: 0,
          attributesInclOfs: [] as StructAttributeOfs<any>[]
        });
        this.bytes = al.funcs.overall(tmp.bytes);
        this.attributes = tmp.attributesInclOfs;
      }
      public get initial(): StructInitial {
        const ret = this.attributes.reduce((r, i) => {
          if (i.initial !== undefined) {
            r[i.name] = i.initial;
          } else if (i.type.initial !== undefined) {
            r[i.name] = i.type.initial;
          }
          return r;
        }, {} as StructInitial);
        // console.log(`Struct.initial:${JSON.stringify(this.attributes)}->${JSON.stringify(ret)}`);
        return ret;
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

    export function isScalar<T>(def: Type<T>): boolean {
      return !!ScalarTypesList.find(i => def.type === i.type);
    }
    export function isFixedArray<T>(def: Type<T>): boolean {
      return def.type === FixedArray.type || def.type == FixedCString.type;
    }
    export function isStruct<T>(def: Type<T>): boolean {
      return def.type === Struct.type;
    }
    export enum AttributeType {
      Scalar,
      FixedArray,
      Struct
    }
    export function toAttributeType<T>(def: Type<T>) {
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
