import { Option, SomeOption, NoneOption, OrUndefined, isSome } from '../optional';
import { Definition as Base, ScalarTypeArg } from './base';
import { Definition as Uint32 } from './uint32';
import { ChunkBuffer } from '../stream-buffer';

export interface MutableType {
  high: number;
  low: number;
}

export type Type = Readonly<MutableType>;

export type ValueType = Type;

export abstract class Definition extends Base<Type> {
  public static readonly uint32: Uint32 = new Uint32();
  public static readonly bytes: number = 8;
  public readonly givenInitial: Option<Partial<Type>>;
  public readonly bytes: number = Definition.bytes;

  public coerce(hl?: Partial<Type>): Option<Partial<Type>> {
    if (typeof hl === 'object') {
      const high = Definition.uint32.coerce(hl.high);
      const low = Definition.uint32.coerce(hl.low);
      if (isSome(high) && isSome(low)) {
        return SomeOption({ low: low.some, high: high.some });
      }
      if (isSome(high)) {
        return SomeOption({ high: high.some });
      }
      if (isSome(low)) {
        return SomeOption({ low: low.some });
      }
    }
    return NoneOption;
  }

  public create(...args: Partial<Type>[]): Type {
    const data = args
      .concat(OrUndefined(this.givenInitial))
      .concat({ high: 0, low: 0 })
      .filter((i) => typeof i === 'object')
      .reduce((r, i) => {
        const v = this.coerce(i);
        if (isSome(v)) {
          r.push(v.some);
        }
        return r;
      }, []);
    return Object.assign({}, ...data.reverse());
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public fromStreamChunk(chunk: ChunkBuffer, _name = 'HighLow'): Type {
    return {
      low: chunk.readUint32(),
      high: chunk.readUint32(),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public toStreamChunk(val: Type, chunk: ChunkBuffer, _name = 'HighLow'): void {
    chunk.writeUint32(val.low);
    chunk.writeUint32(val.high);
  }

  public constructor(ival?: ScalarTypeArg<Partial<Type>>) {
    super();
    const val = (ival || {}).initial;
    this.givenInitial = this.coerce(val);
  }
}
