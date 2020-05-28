import { Option, SomeOption, NoneOption, OrUndefined, isSome } from '../optional';
import { Type, TypeName, ScalarTypeArg } from './type';
import { CharInitType, Definition as Char } from './char';
import { Funcs, funcsMapper } from '../align';
import { ChunkBuffer } from '../stream-buffer';

export type FixedCStringInitType = string | CharInitType[];
export interface FixedCStringArg {
  readonly length: number;
  readonly initial?: FixedCStringInitType;
  readonly alignFuncs?: Funcs<string>;
}

export class Definition implements Type<number[]> {
  public static readonly type: TypeName = 'FixedCString';
  public static readonly element: Char = new Char();

  public readonly type: TypeName = Definition.type;
  public readonly element: Char = Definition.element;
  public readonly bytes: number;
  public readonly length: number;
  public readonly alignFuncs: Funcs<string>;
  // public readonly initial: number[];
  public readonly givenInitial: Option<FixedCStringInitType>;

  public create(...initials: FixedCStringInitType[]): number[] {
    const gi = OrUndefined(this.givenInitial);
    const datas = initials
      .concat(gi ? [gi] : undefined)
      .map((i) => this.coerce(i))
      .filter((i) => isSome(i))
      .map((i) => isSome(i) && i.some)
      .concat([new Array(this.length).fill(Definition.element.create())]);
    const items = datas.reduce(
      (r, bArray) => {
        bArray.forEach((item, idx) => {
          r[idx].push(item);
        });
        return r;
      },
      new Array(this.length).fill(undefined).map((i) => []),
    );
    return items.reduce((r, item, idx) => {
      r[idx] = Definition.element.create(...item);
      return r;
    }, new Array(this.length).fill(Definition.element.create()));
  }

  public coerce(m: FixedCStringInitType | undefined): Option<number[]> {
    if (typeof m === 'string' || Array.isArray(m)) {
      const r = Array.from(m.slice(0, this.length - 1)).map((item) => {
        const x = Definition.element.coerce(item);
        return isSome(x) ? x.some : 0;
      });
      if (r.length === this.length - 1) {
        r.push(0); // trailing 0
      }
      return SomeOption(r);
    }
    return NoneOption;
  }

  constructor(iel?: FixedCStringArg) {
    const el: Partial<FixedCStringArg> = iel || {};
    const al = funcsMapper({ ...el.alignFuncs, element: 'byte' });
    this.alignFuncs = al.names;
    this.length = el.length;
    this.bytes = al.funcs.overall(el.length);
    this.givenInitial = this.coerce(el.initial);
    // this.initial = this.create(el.initial);
  }
}

export type FixedCString = Definition;

export function fromStream(
  { length, bytes }: { length: number; bytes: number },
  rb: ChunkBuffer,
): number[] {
  const ret = Array<number>(length).fill(0);
  for (let i = 0; i < bytes; ++i) {
    const val = rb.readUint8();
    if (i < length) {
      ret[i] = val;
    }
  }
  return ret;
}
export function toStream(
  { bytes }: { length: number; bytes: number },
  val: number[],
  wb: ChunkBuffer,
) {
  for (let i = 0; i < bytes; ++i) {
    wb.writeUint8(val[i] || 0);
  }
}
