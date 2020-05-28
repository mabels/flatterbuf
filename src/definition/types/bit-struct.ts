import { Funcs, funcsMapper } from '../align';
import { Option, OrUndefined, NoneOption, isNone, SomeOption } from '../optional';

import { Definition as _Boolean } from './boolean';
import { Definition as Uint32 } from './uint32';
import { Definition as Type, TypeName, NamedType } from './type';
import { BitStruct } from '.';

export interface BitItem {
  readonly name: string;
  readonly start: number;
  readonly length?: number; // default 1;
  readonly initial?: number | boolean;
}
export interface BooleanBitItemWithLength extends BitItem {
  readonly length: 1;
  readonly type: Boolean;
}
export interface UInt32BitItemWithLength extends BitItem {
  readonly length: number;
  readonly type: Uint32;
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
  readonly alignFuncs: Funcs<string>;
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
export class Definition implements NamedType<BitStructInitial> {
  public static readonly type: TypeName = 'BitStruct';
  // private readonly data: FixedArray<number>;
  public readonly type: TypeName = Definition.type;
  public readonly name: string;
  public readonly bytes: number;
  public readonly length: number;
  public readonly alignFuncs: Funcs<string>;
  public readonly bits: BitItemWithLength[];
  public readonly bitsByName: BitsByName;
  // public readonly initial: BitStructInitial = {};
  public readonly givenInitial: Option<Partial<BitStructInitial>>;

  public constructor(arg: Partial<BitStructArg>) {
    const al = funcsMapper({ ...arg.alignFuncs, element: 'byte' });
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
      const my = { ...bit };
      delete my.initial;
      if (length === 1) {
        return {
          ...my,
          length: 1,
          type: new _Boolean(!!bit.initial ? { initial: !!bit.initial } : undefined),
        };
      } else {
        return {
          ...my,
          length,
          type: new Uint32(~~bit.initial ? { initial: ~~bit.initial } : undefined),
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
    // this.initial = this.create(arg.initial);
    //   this.bits.reduce((r, b) => {
    //     if (
    //       isSome(this.givenInitial) &&
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
      .concat(OrUndefined(this.givenInitial))
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

  public coerce(val?: BitStructInitial): Option<BitStructInitial> {
    let ret: Option<BitStructInitial> = NoneOption;
    if (typeof val === 'object') {
      this.bits.forEach((bit) => {
        if (['boolean', 'number'].includes(typeof val[bit.name])) {
          if (isNone(ret)) {
            ret = SomeOption({});
          }
          ret.some[bit.name] = bit.length === 1 ? !!val[bit.name] : val[bit.name];
        }
      });
    }
    return ret;
  }
}

export type BitStruct = Definition;
