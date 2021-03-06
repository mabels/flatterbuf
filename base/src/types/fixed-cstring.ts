import { Option, SomeOption, NoneOption, OrUndefined, isSome, SomeType } from '../optional';
import { Definition as Base, TypeName } from './base';
import { CharInitType, Definition as Char } from './char';
import { Funcs, funcsMapper } from '../align';
import { ChunkBuffer } from '../stream-buffer';

export type FixedCStringInitType<A = number> = undefined | string | A[];
export interface FixedCStringArg {
  readonly length: number;
  readonly initial?: FixedCStringInitType;
  readonly alignFuncs?: Funcs<string>;
}

export type ValueType = number[];

export class Definition extends Base<number[]> {
  public static readonly type: TypeName = 'FixedCString';
  public static readonly element: Char = new Char();

  public readonly type: TypeName = Definition.type;
  public readonly element: Char = Definition.element;
  public readonly bytes: number;
  public readonly length: number;
  public readonly alignFuncs: Funcs<string>;
  // public readonly initial: number[];
  public readonly givenInitial: Option<FixedCStringInitType>;

  public create(...initials: FixedCStringInitType<number|undefined>[]): number[] {
    const gi = OrUndefined(this.givenInitial);
    const datas = initials
      .concat(gi ? [gi] : [])
      .map((i) => this.coerce(i))
      .filter((i) => isSome(i))
      .map((i) => (i as SomeType<number[]>).some)
      .concat([new Array(this.length).fill(Definition.element.create())]);
    const items = datas.reduce(
      (r, bArray) => {
        bArray.forEach((item, idx) => {
          r[idx].push(item);
        });
        return r;
      },
      new Array(this.length).fill(undefined).map(() => [] as number[]),
    );
    return items.reduce((r, item, idx) => {
      r[idx] = Definition.element.create(...item);
      return r;
    }, new Array(this.length).fill(Definition.element.create()));
  }

  public coerce(m?: FixedCStringInitType<number | undefined>): Option<number[]> {
    if (typeof m == 'string' || Array.isArray(m)) {
      const r = Array.from(m.slice(0, this.length - 1) as CharInitType[]).map((item) => {
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

  constructor(iel: FixedCStringArg) {
    super();
    const el: FixedCStringArg = iel; // artefact
    const al = funcsMapper({ ...el.alignFuncs, element: 'byte' });
    this.alignFuncs = al.names;
    this.length = el.length;
    this.bytes = al.funcs.overall(el.length);
    this.givenInitial = this.coerce(el.initial);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public fromStreamChunk(chunk: ChunkBuffer, _name: string = this.type): number[] {
    const ret = Array<number>(this.length);
    for (let i = 0; i < this.length; ++i) {
      const val = chunk.readUint8();
      ret[i] = val;
    }
    return ret;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public toStreamChunk(val: number[], chunk: ChunkBuffer, _name: string = this.type): void {
    for (let i = 0; i < this.length; ++i) {
      chunk.writeUint8(val[i] || 0);
    }
  }
}

export type FixedCString = Definition;
