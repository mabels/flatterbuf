import { Runtime } from '../runtime';
import { initialValue } from '../generator/ts';

export namespace Definition {
  export namespace Utils {
    export type NestedPartial<T> = {
      [P in keyof T]?: NestedPartial<T[P]>;
    };
    export interface SomeType<T> {
      readonly none: false;
      readonly some: T;
    }
    export function SomeOption<T>(t: T): SomeType<T> {
      return {
        none: false,
        some: t,
      };
    }

    export interface NoneType {
      readonly none: true;
    }

    export const NoneOption: NoneType = {
      none: true,
    };

    export type Option<T> = SomeType<T> | NoneType;

    export function isNone<T>(m: Utils.Option<T>): m is NoneType {
      return m.none ? true : false;
    }
    export function isSome<T>(m: Utils.Option<T>): m is SomeType<T> {
      return m.none ? false : true;
    }
    export function OrUndefined<T>(m: Utils.Option<T>): T | undefined {
      return isSome(m) ? m.some : undefined;
    }
  }
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
      EightByte: EightByte,
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
        funcs: { element: element.func, overall: overall.func },
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

    export type FilterFunc<T> = (val: T | undefined) => Utils.Option<T>;
    export type CreateFunc<T> = (...vals: Partial<T>[]) => T;

    export interface Type<T> {
      readonly type: TypeName;
      readonly bytes: number;
      // readonly initial: T;
      readonly givenInitial: Utils.Option<unknown>;
      coerce(val: unknown): Utils.Option<unknown>;
      create(...vals: (undefined | T | Partial<T>)[]): T;
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
      public readonly givenInitial: Utils.Option<boolean>;
      public coerce(val: boolean | undefined): Utils.Option<boolean> {
        return typeof val === 'boolean' ? Utils.SomeOption(val) : Utils.NoneOption;
      }
      public create(...vals: boolean[]): boolean {
        return vals.concat(this.initial).find((i: boolean) => Utils.isSome(this.coerce(i))) || false;
      }

      public constructor(arg?: ScalarTypeArg<boolean>) {
        const val = (arg || {}).initial;
        this.givenInitial = this.coerce(val);
        this.initial = this.create(val);
      }
    }

    class NumberType {
      public readonly initial: number;
      public readonly givenInitial: Utils.Option<number>;

      public coerce: FilterFunc<number>;

      public create(...vals: number[]): number {
        return vals.concat(this.initial).find((i) => Utils.isSome(this.coerce(i))) || 0;
      }

      constructor(ival: number | undefined, fn: (filter: number) => number) {
        this.coerce = (val: number | undefined) =>
          typeof val === 'number' ? Utils.SomeOption(fn(val)) : Utils.NoneOption;
        this.givenInitial = this.coerce(ival);
        this.initial = this.create(ival);
      }
    }

    export class Uint8 extends NumberType implements Type<number> {
      public static readonly type: TypeName = 'Uint8';
      public static readonly bytes: number = 1;
      public readonly type: TypeName = Uint8.type;
      public readonly bytes: number = Uint8.bytes;
      // public readonly notRequire: boolean;
      public constructor(arg: ScalarTypeArg<number> = {}) {
        super(arg.initial, (v) => ~~v & 0xff);
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
      public readonly givenInitial: Utils.Option<number>;

      public create(...vals: CharInitType[]): number {
        const found = vals.concat(Utils.OrUndefined(this.givenInitial)).find((val) => {
          const typ = typeof val;
          return typ === 'number' || typ === 'string';
        });
        if (typeof found === 'string') {
          return found.charCodeAt(0);
        }
        if (typeof found === 'number') {
          return ~~found;
        }
        return 0;
      }

      public coerce(v: CharInitType | undefined): Utils.Option<number> {
        if (typeof v === 'number') {
          return Utils.SomeOption(v);
        }
        if (typeof v === 'string') {
          return Utils.SomeOption(v.charCodeAt(0));
        }
        return Utils.NoneOption;
      }

      public constructor(arg?: CharScalarTypeArg) {
        const val = (arg || {}).initial;
        this.givenInitial = this.coerce(val);
        this.initial = this.create(val);
        // console.log('Char=', arg, this.initial);
      }
    }

    export class Uint16 extends NumberType implements Type<number> {
      public static readonly type: TypeName = 'Uint16';
      public static readonly bytes: number = 2;
      // public static readonly create: typeof numberCreate = numberCreate;
      public readonly type: TypeName = Uint16.type;
      public readonly bytes: number = Uint16.bytes;
      // public readonly notRequire: boolean;
      public constructor(arg: ScalarTypeArg<number> = {}) {
        super(arg.initial, (v) => ~~v & 0xffff);
      }
    }

    export class Short extends NumberType implements Type<number> {
      public static readonly type: TypeName = 'Short';
      public static readonly bytes: number = 2;
      public readonly type: TypeName = Short.type;
      public readonly bytes: number = Short.bytes;
      public constructor(arg: ScalarTypeArg<number> = {}) {
        super(arg.initial, (v) => (~~v & 0x7fff) | ((v >= 0 ? 0 : 1) << 15));
      }
    }

    export class Uint32 extends NumberType implements Type<number> {
      public static readonly type: TypeName = 'Uint32';
      public static readonly bytes: number = 4;
      // public static readonly create: typeof numberCreate = numberCreate;
      public readonly type: TypeName = Uint32.type;
      public readonly bytes: number = Uint32.bytes;
      public constructor(arg: ScalarTypeArg<number> = {}) {
        super(arg.initial, (v) => ~~v & 0xffffffff);
      }
    }

    export class Int extends NumberType implements Type<number> {
      public static readonly type: TypeName = 'Int';
      public static readonly bytes: number = 4;
      // public static readonly create: typeof numberCreate = numberCreate;
      public readonly type: TypeName = Int.type;
      public readonly bytes: number = Int.bytes;
      // public readonly notRequire: boolean;
      public constructor(arg: ScalarTypeArg<number> = {}) {
        super(arg.initial, (v) => (~~v & 0x7fffffff) | ((v >= 0 ? 0 : 1) << 31));
      }
    }

    export class Float extends NumberType implements Type<number> {
      public static readonly type: TypeName = 'Float';
      public static readonly bytes: number = 4;
      // public static readonly create: typeof numberCreate = numberCreate;
      public readonly type: TypeName = Float.type;
      public readonly bytes: number = Float.bytes;
      public constructor(arg: ScalarTypeArg<number> = {}) {
        super(arg.initial, (v) => v);
      }
    }

    export class Double extends NumberType implements Type<number> {
      public static readonly type: TypeName = 'Double';
      public static readonly bytes: number = 8;
      // public static readonly create: typeof numberCreate = numberCreate;
      public readonly type: TypeName = Double.type;
      public readonly bytes: number = Double.bytes;
      public constructor(arg: ScalarTypeArg<number> = {}) {
        super(arg.initial, (v) => v);
      }
    }

    export interface HighLow {
      readonly high: number;
      readonly low: number;
    }
    export class HighLowType {
      public static readonly uint32: Uint32 = new Uint32();
      public readonly initial: HighLow;
      public readonly givenInitial: Utils.Option<Partial<HighLow>>;

      public coerce(hl?: Partial<HighLow>): Utils.Option<Partial<HighLow>> {
        if (typeof hl === 'object') {
          const high = HighLowType.uint32.coerce(hl.high);
          const low = HighLowType.uint32.coerce(hl.low);
          if (Utils.isSome(high) && Utils.isSome(low)) {
            return Utils.SomeOption({ low: low.some, high: high.some });
          }
          if (Utils.isSome(high)) {
            return Utils.SomeOption({ high: high.some });
          }
          if (Utils.isSome(low)) {
            return Utils.SomeOption({ low: low.some });
          }
        }
        return Utils.NoneOption;
      }

      public create(...args: Partial<HighLow>[]): HighLow {
        const data = args
          .concat(Utils.OrUndefined(this.givenInitial))
          .concat({ high: 0, low: 0 })
          .filter((i) => typeof i === 'object')
          .reduce((r, i) => {
            const v = this.coerce(i);
            if (Utils.isSome(v)) {
              r.push(v.some);
            }
            return r;
          }, []);
        return Object.assign({}, ...data.reverse());
      }
      public constructor(ival?: ScalarTypeArg<Partial<HighLow>>) {
        const val = (ival || {}).initial;
        this.givenInitial = this.coerce(val);
        this.initial = this.create(val);
      }
    }

    export class Uint64 extends HighLowType implements Type<HighLow> {
      public static readonly type: TypeName = 'Uint64';
      public static readonly bytes: number = 8;
      // public static readonly create: typeof HighLow.create = HighLow.create;
      public readonly type: TypeName = Uint64.type;
      public readonly bytes: number = Uint64.bytes;
      public constructor(arg?: ScalarTypeArg<Partial<HighLow>>) {
        super(arg);
      }
    }

    export class Long extends HighLowType implements Type<HighLow> {
      public static readonly type: TypeName = 'Long';
      public static readonly bytes: number = 8;
      // public static readonly create: typeof HighLow.create = HighLow.create;
      public readonly type: TypeName = Long.type;
      public readonly bytes: number = Long.bytes;
      public constructor(arg?: ScalarTypeArg<Partial<HighLow>>) {
        super(arg);
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

    export class FixedArray<B> implements ArrayTypeAttribute<B> {
      public static readonly type: TypeName = 'FixedArray';

      public readonly type: TypeName = FixedArray.type;
      public readonly bytes: number;
      public readonly length: number;
      public readonly element: Type<B>;
      public readonly alignFuncs: Align.Funcs<string>;
      public readonly initial: B[];
      public readonly givenInitial: Utils.Option<Partial<B>[]>;
      public readonly initialDefault: B[];


      public constructor(el: FixedArrayArg<B>) {
        this.length = el.length;
        const al = Align.funcsMapper(el.alignFuncs);
        this.alignFuncs = al.names;
        this.bytes = al.funcs.overall(el.length * al.funcs.element(el.element.bytes));
        this.element = el.element;
        // this.initialDefault = Array(this.length).fill(this.element.create(this.element.initial));
        if (el.initial) {
          this.givenInitial = Utils.SomeOption(el.initial);
        } else {
          this.givenInitial = Utils.NoneOption;
        }
        this.initial = this.create(el.initial);
      }

      public create(...initials: Partial<B>[][]): B[] {
        const datas = initials
          .concat([Utils.OrUndefined(this.givenInitial)])
          .filter(i => Array.isArray(i))
          .concat([(new Array(this.length)).fill(this.element.create())]);
        const items = datas.reduce((r, bArray) => {
            bArray.slice(0, this.length).forEach((item, idx) => {
              const v = this.element.coerce(item);
              if (Utils.isSome(v)) {
                r[idx].push(v.some);
              }
            });
          return r;
        }, new Array(this.length).fill(undefined).map(i => []));
        return items.reduce((r, item, idx) => {
          r[idx] = this.element.create(...item);
          return r;
        }, new Array(this.length));
        // const items: unknown[][] = initials
        //   .concat([this.initial, this.initialDefault])
        //   .filter((i) => Array.isArray(i))
        //   .reduce(
        //     (ret, initial) => {
        //       // console.log(`YYYYYYYYY=>${initial}`);
        //       for (let i = 0; i < this.length; ++i) {
        //         if (initial[i] !== undefined) {
        //           ret[i].push(initial[i]);
        //         }
        //       }
        //       return ret;
        //     },
        //     Array(this.length)
        //       .fill(undefined)
        //       .map((_) => []),
        //   );
        // // console.log(`XXXXXXX=>${JSON.stringify(initials)}, ${JSON.stringify(items)}`);
        // return items.map((item) => {
        //   //  console.log(`OOOOOOO=>${JSON.stringify(item)}`);
        //   if (Definition.Types.isFixedCString(this.element)) {
        //     const scdef = (this.element as unknown) as Definition.Types.FixedCString;
        //     return scdef.create(...(item as FixedCStringInitType[]));
        //   } else if (Definition.Types.isFixedArray(this.element)) {
        //     const adef = (this.element as unknown) as Definition.Types.FixedArray<unknown>;
        //     return adef.create(...(item as unknown[][]));
        //   } else if (
        //     Definition.Types.isScalar(this.element) ||
        //     Definition.Types.isStruct(this.element)
        //   ) {
        //     const sdef = (this.element as unknown) as Definition.Types.Type<unknown>;
        //     return sdef.create(...item);
        //   }
        //   throw 'unknown type';
        // }) as B[];
      }

      public coerce(val: (Partial<B> | undefined)[] | undefined): Utils.Option<Partial<B>[]> {
        if (!Array.isArray(val)) {
          return Utils.NoneOption;
        }
        let found = false;
        const ret: Partial<B>[] = val.map(i => {
          const e = this.element.coerce(i);
          if (Utils.isNone(e)) {
            return undefined;
          }
          found = true;
          return e.some as any;
        });
        if (!found) {
          return Utils.NoneOption;
        }
        return Utils.SomeOption(ret);
      }
    }

    export type FixedCStringInitType = (string | CharInitType[]);
    export interface FixedCStringArg {
      readonly length: number;
      readonly initial?: FixedCStringInitType;
      readonly alignFuncs?: Align.Funcs<string>;
    }

    export class FixedCString implements Type<number[]> {
      public static readonly type: TypeName = 'FixedCString';
      public static readonly element: Char = new Char();

      public readonly type: TypeName = FixedCString.type;
      public readonly bytes: number;
      public readonly length: number;
      public readonly alignFuncs: Align.Funcs<string>;
      public readonly initial: number[];
      public readonly givenInitial: Utils.Option<FixedCStringInitType>;

      public create(...initials: FixedCStringInitType[]): number[] {
        const gi = Utils.OrUndefined(this.givenInitial);
        const datas = initials
          .concat(gi ? [gi] : undefined)
          .map(i => this.coerce(i))
          .filter(i => Utils.isSome(i))
          .map(i => Utils.isSome(i) && i.some)
          .concat([(new Array(this.length)).fill(FixedCString.element.create())]);
        const items = datas.reduce((r, bArray) => {
            bArray.forEach((item, idx) => {
              r[idx].push(item);
            });
          return r;
        }, new Array(this.length).fill(undefined).map(i => []));
        return items.reduce((r, item, idx) => {
          r[idx] = FixedCString.element.create(...item);
          return r;
        }, new Array(this.length).fill(FixedCString.element.create()));
      }

      public coerce(m: FixedCStringInitType | undefined): Utils.Option<number[]> {
        if (typeof m === 'string' || Array.isArray(m)) {
          const r = Array.from(m.slice(0, this.length - 1)).map(item => {
              const x = FixedCString.element.coerce(item);
              return Utils.isSome(x) ? x.some : 0;
            });
          if (r.length === this.length - 1) {
            r.push(0); // trailing 0
          }
          return Utils.SomeOption(r);
        }
        return Utils.NoneOption;
      }

      constructor(iel?: FixedCStringArg) {
        const el: Partial<FixedCStringArg> = (iel || {});
        const al = Align.funcsMapper({ ...el.alignFuncs, element: 'byte' });
        this.alignFuncs = al.names;
        this.length = el.length;
        this.bytes = al.funcs.overall(el.length);
        this.givenInitial = this.coerce(el.initial);
        // this.initial = this.create(el.initial);
      }
    }

    export interface NamedType<T> extends Type<T> {
      readonly name: string;
    }

    export interface StructBaseAttribute {
      readonly name: string;
      // readonly notRequired?: boolean;
    }

    export interface StructAttribute<T> extends StructBaseAttribute {
      // readonly initial?: T;
      readonly type: Type<T>;
    }

    export interface StructAttributeOfs<T> extends StructAttribute<T> {
      readonly ofs: number;
    }

    export type StructInitial = Record<string, any>;
    export type StructByName = Record<string, StructAttributeOfs<any>>;
    export type StructMerge = Record<string, unknown[]>;

    export interface StructArg {
      readonly name: string;
      readonly alignFuncs?: Partial<Align.Funcs<string>>;
      readonly attributes: StructAttribute<unknown>[];
      readonly initial?: StructInitial;
    }

    export class Struct implements NamedType<StructInitial> {
      public static readonly type: TypeName = 'Struct';
      public readonly type: TypeName = Struct.type;
      public readonly bytes: number;
      public readonly name: string;
      public readonly alignFuncs: Align.Funcs<string>;
      public readonly attributes: StructAttributeOfs<any>[];
      public readonly attributeByName: StructByName;

      public initial: StructInitial;
      public givenInitial: Utils.Option<Partial<StructInitial>>;
      // Type(typelevel)
      public constructor(st: StructArg) {
        this.name = st.name;
        const al = Align.funcsMapper(st.alignFuncs);
        this.alignFuncs = al.names;

        const tmp = st.attributes.reduce(
          (res, attr) => {
            res.attributesInclOfs.push({
              ...attr,
              // notRequired: !!attr.notRequired,
              ofs: res.bytes,
            });
            res.bytes = res.bytes + al.funcs.element(attr.type.bytes);
            return res;
          },
          {
            bytes: 0,
            attributesInclOfs: [] as StructAttributeOfs<any>[],
          },
        );
        this.bytes = al.funcs.overall(tmp.bytes);
        this.attributes = tmp.attributesInclOfs;
        this.attributeByName = this.attributes.reduce((r, attr) => {
          r[attr.name] = attr;
          return r;
        }, {} as StructByName);
        // this.attributes.forEach((attr) => {
        //   if (givenInitial.hasOwnProperty(attr.name)) {
        //     this.initial[attr.name] = attr.type.create(
        //       givenInitial[attr.name],
        //       attr.initial,
        //       attr.type.initial,
        //     );
        //     if (Utils.isNone(this.givenInitial)) {
        //       this.givenInitial = Utils.SomeOption({});
        //     }
        //     if (Utils.isSome(this.givenInitial)) {
        //       this.givenInitial.some[attr.name] = givenInitial[attr.name];
        //     }
        //   }
        // });
        this.givenInitial = this.coerce(st.initial);
        this.initial = this.create(st.initial);
      }

      public coerce(vals: Record<string, any>): Utils.Option<Record<string, any>> {
        let ret: Utils.Option<StructInitial> = Utils.NoneOption;
        if (typeof vals === 'object') {
          this.attributes.forEach((attr) => {
            const val = attr.type.coerce(vals[attr.name]);
            if (Utils.isSome(val)) {
              if (Utils.isNone(ret)) {
                ret = Utils.SomeOption({});
              }
              ret.some[attr.name] = val.some;
            }
          });
        }
        return ret;
      }

      public create(...rargs: StructInitial[]): StructInitial {
        const data = rargs.concat(Utils.OrUndefined(this.givenInitial))
        .filter((i) => Utils.isSome(this.coerce(i)))
        .reduce(
          (r, val) => {
            this.attributes.forEach((attr) => {
              const m = attr.type.coerce(val[attr.name]);
              if (Utils.isSome(m)) {
                r[attr.name].push(m.some);
              }
            });
            return r;
          },
          this.attributes.reduce((r, attr) => {
            r[attr.name] = [];
            return r;
          }, {} as Record<string, any[]>),
        );
      // console.log(`YYYYY`, data, this.bits);
      return this.attributes.reduce((r, attr) => {
        r[attr.name] = attr.type.create(...data[attr.name]);
        // console.log(`XXXXXX`, bit.name, r[bit.name], data[bit.name]);
        return r;
      }, {} as StructInitial);
        // const data: StructMerge = vals
        //   .concat([this.initial])
        //   .filter((i) => typeof i === 'object')
        //   .reduce(
        //     (ret, val) => {
        //       this.attributes.forEach((attr) => {
        //         const v = val[attr.name];
        //         if (v !== undefined) {
        //           ret[attr.name].push(v);
        //         }
        //       });
        //       return ret;
        //     },
        //     this.attributes.reduce((r, attr) => {
        //       r[attr.name] = [];
        //       return r;
        //     }, {} as StructMerge),
        //   );

        // // console.log(`XXXXXXX=>${JSON.stringify(initials)}, ${JSON.stringify(items)}`);
        // return this.attributes.reduce((ret, attr) => {
        //   const inits = data[attr.name];
        //   if (Definition.Types.isFixedCString(attr.type)) {
        //     const scdef = (attr.type as unknown) as Definition.Types.FixedCString;
        //     ret[attr.name] = scdef.create(...(inits as FixedCStringInitType[]));
        //   } else if (Definition.Types.isFixedArray(attr.type)) {
        //     const adef = (attr.type as unknown) as Definition.Types.FixedArray<unknown>;
        //     ret[attr.name] = adef.create(...(inits as unknown[][]));
        //   } else if (Definition.Types.isScalar(attr.type) || Definition.Types.isStruct(attr.type)) {
        //     const sdef = (attr.type as unknown) as Definition.Types.Type<unknown>;
        //     ret[attr.name] = sdef.create(...inits);
        //   } else {
        //     throw Error(`Unknown attribute ${attr}`);
        //   }
        //   return ret;
        // }, {} as StructInitial);
      }

      public toStream(
        data: Partial<StructInitial>,
        wb: Runtime.StreamBuffer,
      ): Runtime.StreamBuffer {
        throw Error('not implemented in base Class');
      }
    }

    export interface BitItem {
      readonly name: string;
      readonly start: number;
      readonly length?: number; // default 1;
      readonly initial?: number | boolean;
    }
    export interface BooleanBitItemWithLength extends BitItem {
      readonly length: 1;
      readonly type: Definition.Types.Boolean;
    }
    export interface UInt32BitItemWithLength extends BitItem {
      readonly length: number;
      readonly type: Definition.Types.Uint32;
    }

    export interface BitItemWithLength extends BitItem {
      readonly length: number;
      readonly type: Type<boolean | number>;
    }

    export type BitStructInitial = Record<string, boolean | number>;
    export interface BitStructArg {
      readonly name: string;
      readonly length: number; // default 1
      readonly bits: BitItem[];
      readonly alignFuncs: Align.Funcs<string>;
      readonly initial: BitStructInitial;
    }
    export type BitsByName = Record<string, BitItemWithLength>;

    export function BitStructValue(val: number | boolean, bits: number): number | boolean {
      if (bits === 1) {
        return !!val;
      }
      return ~~val & (2 ** bits - 1);
    }
    // export type BitStructInitial = { [key: string]: BitItemWithLength };
    export class BitStruct implements NamedType<BitStructInitial> {
      public static readonly type: TypeName = 'BitStruct';
      // private readonly data: FixedArray<number>;
      public readonly type: TypeName = BitStruct.type;
      public readonly name: string;
      public readonly bytes: number;
      public readonly length: number;
      public readonly alignFuncs: Align.Funcs<string>;
      public readonly bits: BitItemWithLength[];
      public readonly bitsByName: BitsByName;
      public readonly initial: BitStructInitial = {};
      public readonly givenInitial: Utils.Option<Partial<BitStructInitial>>;

      public constructor(arg: Partial<BitStructArg>) {
        const al = Align.funcsMapper({ ...arg.alignFuncs, element: 'byte' });
        this.alignFuncs = al.names;
        this.length = typeof arg.length === 'number' ? arg.length : 1;
        this.bytes = al.funcs.overall(this.length);
        const tmpLen = new Set((arg.bits || []).map((i) => i.name));
        if (tmpLen.size != (arg.bits || []).length) {
          throw Error('The bits are double definied');
        }

        this.bits = (arg.bits || []).map((bit) => {
          const length = typeof bit.length === 'number' ? bit.length : 1;
          if (bit.start + length > this.bytes * 8) {
            throw RangeError(
              `BitStruct:${bit.name} requesting more bits than length:${this.bytes}:${bit.start}:${length}`,
            );
          }
          if (length === 1) {
            return {
              ...bit,
              length: 1,
              type: new Types.Boolean({ initial: bit.initial as boolean }),
            };
          } else {
            return {
              ...bit,
              length,
              type: new Types.Uint32({ initial: bit.initial as number }),
              // initial: BitStructValue(bit.initial, length),
            };
          }
        });
        this.bitsByName = this.bits.reduce((r, b) => {
          r[b.name] = b;
          return r;
        }, {} as BitsByName);

        this.name =
          typeof arg.name === 'string'
            ? arg.name
            : (this.bits || [])
                .map(
                  (i) =>
                    `${i.name}S${i.start}L${i.length}` +
                    `${['boolean', 'number'].includes(typeof i.initial) ? `I${~~i.initial}` : ''}`,
                )
                .sort((a, b) => a.localeCompare(b))
                .join('_');

        this.givenInitial = this.coerce(arg.initial);
        this.initial = this.create(arg.initial);
        //   this.bits.reduce((r, b) => {
        //     if (
        //       Utils.isSome(this.givenInitial) &&
        //       ['boolean', 'number'].includes(typeof this.givenInitial.some[b.name])
        //     ) {
        //       r[b.name] = this.bitsByName[b.name].type.create(b.initial);
        //     }
        //     return r;
        //   }, {} as BitStructInitial),
        // );
      }

      public create(...rargs: Partial<BitStructInitial>[]): BitStructInitial {
        const data = rargs
          .concat(Utils.OrUndefined(this.givenInitial))
          .filter((i) => typeof i === 'object')
          .reduce(
            (r, val) => {
              this.bits.forEach((bit) => {
                if (['boolean', 'number'].includes(typeof val[bit.name])) {
                  if (bit.length === 1) {
                    r[bit.name].push(!!val[bit.name]);
                  } else {
                    r[bit.name].push(~~val[bit.name]);
                  }
                }
              });
              return r;
            },
            this.bits.reduce((r, bit) => {
              r[bit.name] = [];
              return r;
            }, {} as Record<string, (boolean | number)[]>),
          );
        // console.log(`YYYYY`, data, this.bits);
        return this.bits.reduce((r, bit) => {
          r[bit.name] = bit.type.create(...data[bit.name]);
          // console.log(`XXXXXX`, bit.name, r[bit.name], data[bit.name]);
          return r;
        }, {} as BitStructInitial);
      }

      public coerce(val?: BitStructInitial): Utils.Option<BitStructInitial> {
        let ret: Utils.Option<BitStructInitial> = Utils.NoneOption;
        if (typeof val === 'object') {
          this.bits.forEach((bit) => {
            if (['boolean', 'number'].includes(typeof val[bit.name])) {
              if (Utils.isNone(ret)) {
                ret = Utils.SomeOption({});
              }
              ret.some[bit.name] = bit.length === 1 ? !!val[bit.name] : val[bit.name];
            }
          });
        }
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

    export const SimpleScalarTypesList = [
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
      Types.Double,
    ];

    export const ScalarTypesList = [...SimpleScalarTypesList, FixedCString, BitStruct];

    export function isScalar<T>(def: Type<T>): boolean {
      return !!ScalarTypesList.find((i) => def.type === i.type);
    }

    export function isBitStruct(def: Type<unknown>): def is BitStruct {
      return def.type === Definition.Types.BitStruct.type;
    }

    export function isFixedCString(def: Type<unknown>): def is FixedCString {
      return def.type === Definition.Types.FixedCString.type;
    }

    export function isHighLow(def: Type<unknown>): def is Definition.Types.Long {
      return def.type === Definition.Types.Long.type || def.type === Definition.Types.Uint64.type;
    }

    export function isFixedArray<T>(def: Type<T>): boolean {
      return def.type === FixedArray.type;
    }
    export function isStruct<T>(def: Type<T>): boolean {
      return def.type === Struct.type;
    }
    export enum AttributeType {
      Scalar,
      FixedArray,
      Struct,
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
