import { Option, SomeOption, NoneOption, isSome, OrUndefined, isNone } from '../optional';
import { funcsMapper, Funcs } from '../align';

import { Type, TypeName } from './type';

export interface ArrayTypeAttribute<B> extends Type<B[]> {
  readonly element: Type<B>;
  readonly length: number;
}

export interface FixedArrayArg<B> {
  readonly element: Type<B>;
  readonly length: number;
  readonly initial?: B[];
  readonly alignFuncs?: Partial<Funcs<string>>;
}

export class Definition<B> implements ArrayTypeAttribute<B> {
  public static readonly type: TypeName = 'FixedArray';

  public readonly type: TypeName = Definition.type;
  public readonly bytes: number;
  public readonly length: number;
  public readonly element: Type<B>;
  public readonly alignFuncs: Funcs<string>;
  // public readonly initial: B[];
  public readonly givenInitial: Option<Partial<B>[]>;
  public readonly initialDefault: B[];

  public constructor(el: FixedArrayArg<B>) {
    this.length = el.length;
    const al = funcsMapper(el.alignFuncs);
    this.alignFuncs = al.names;
    this.bytes = al.funcs.overall(el.length * al.funcs.element(el.element.bytes));
    this.element = el.element;
    // this.initialDefault = Array(this.length).fill(this.element.create(this.element.initial));
    if (el.initial) {
      this.givenInitial = SomeOption(el.initial);
    } else {
      this.givenInitial = NoneOption;
    }
    // this.initial = this.create(el.initial);
  }

  public create(...initials: Partial<B>[][]): B[] {
    const datas = initials
      .concat([OrUndefined(this.givenInitial)])
      .filter((i) => Array.isArray(i))
      .concat([new Array(this.length).fill(this.element.create())]);
    const items = datas.reduce(
      (r, bArray) => {
        bArray.slice(0, this.length).forEach((item, idx) => {
          const v = this.element.coerce(item);
          if (isSome(v)) {
            r[idx].push(v.some);
          }
        });
        return r;
      },
      new Array(this.length).fill(undefined).map((i) => []),
    );
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

  public coerce(val: (Partial<B> | undefined)[] | undefined): Option<Partial<B>[]> {
    if (!Array.isArray(val)) {
      return NoneOption;
    }
    let found = false;
    const ret: Partial<B>[] = val.map((i) => {
      const e = this.element.coerce(i);
      if (isNone(e)) {
        return undefined;
      }
      found = true;
      return e.some as any;
    });
    if (!found) {
      return NoneOption;
    }
    return SomeOption(ret);
  }
}

export type FixedArray<A> = Definition<A>;
