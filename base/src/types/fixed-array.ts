import { Option, SomeOption, NoneOption, OrUndefined, isSome, isNone } from '../optional';
import { Definition as Base, TypeName } from './base';
import { NestedPartial } from '../nested';
import { Funcs, funcsMapper } from '../align';
import { ChunkBuffer } from '../stream-buffer';

export abstract class ArrayTypeAttribute<B> extends Base<B[]> {
  public abstract readonly element: Base<B>;
  public abstract readonly length: number;
}

export type ElementType<B> = B | NestedPartial<B>;

export interface FixedArrayArg<B, T extends Base<B> = Base<B>> {
  readonly element: T;
  readonly length: number;
  readonly initial?: ElementType<B>[];
  readonly alignFuncs?: Partial<Funcs<string>>;
}

export function create<B>(len: number, cb: (idx: number) => B): Array<B> {
  const my = Array<B>(len);
  for (let i = 0; i < len; ++i) {
    my[i] = cb(i);
  }
  return my;
}

// type fromStreamFN<B> = (rb: StreamBuffer, name: string) => B[];
// type toStreamFN<B> = (_val: B[], wb: StreamBuffer, name: string) => void;

export class Definition<B, T extends Base<B> = Base<B>> extends ArrayTypeAttribute<B> {
  public static readonly type: TypeName = 'FixedArray';

  public readonly type: TypeName = Definition.type;
  public readonly bytes: number;
  public readonly length: number;
  public readonly element: T;
  public readonly alignFuncs: Funcs<string>;
  // public readonly initial: B[];
  public readonly givenInitial: Option<ElementType<B>[]>;

  public constructor(el: FixedArrayArg<B, T>) {
    super();
    this.length = el.length;
    const al = funcsMapper(el.alignFuncs);
    this.alignFuncs = al.names;
    this.bytes = al.funcs.overall(el.length * al.funcs.element(el.element.bytes));
    this.element = el.element;
    if (el.initial) {
      this.givenInitial = SomeOption(el.initial);
    } else {
      this.givenInitial = NoneOption;
    }
  }

  public create(...initials: ElementType<B>[][]): B[] {
    const datas = initials
      .concat([
        OrUndefined(this.givenInitial),
        new Array(this.length).fill(this.element.create()),
      ] as unknown[][])
      .filter((i) => Array.isArray(i));
    const items: ElementType<B>[][] = datas.reduce(
      (r: ElementType<B>[][], bArray) => {
        bArray.slice(0, this.length).forEach((item, idx) => {
          const v = this.element.coerce(item);
          if (isSome(v)) {
            r[idx].push(v.some as ElementType<B>);
          }
        });
        return r;
      },
      new Array(this.length).fill(undefined).map(() => []),
    ) as ElementType<B>[][];
    return items.reduce((r: B[], item, idx) => {
      r[idx] = this.element.create(...item);
      return r;
    }, new Array<B>(this.length)) as B[];
  }

  public coerce(vals: unknown[]): Option<ElementType<B>[]> {
    if (!Array.isArray(vals)) {
      return NoneOption;
    }
    let found = false;
    const ret: ElementType<B>[] = vals.map((i: unknown) => {
      const e = this.element.coerce(i);
      if (isNone(e)) {
        return undefined;
      }
      found = true;
      return e.some as ElementType<B>;
    });
    if (!found) {
      return NoneOption;
    }
    return SomeOption(ret);
  }

  public fromStreamChunk(nrb: ChunkBuffer, name: string = this.type): B[] {
    const ret = Array<B>(this.length);
    for (let i = 0; i < this.length; ++i) {
      ret[i] = this.element.fromStreamChunk(nrb, `${name}.${i}`);
    }
    return ret;
  }

  public toStreamChunk(val: B[], nwb: ChunkBuffer, name: string = this.type): void {
    for (let i = 0; i < this.length; ++i) {
      this.element.toStreamChunk(val[i], nwb, `${name}.${i}`);
    }
  }
}
