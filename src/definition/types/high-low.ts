import { Option, SomeOption, NoneOption, OrUndefined, isSome } from '../optional';
import { Definition as Base, ScalarTypeArg } from './base';
import { Definition as Uint32 } from './uint32';
import { ChunkBuffer } from '../stream-buffer';

export interface MutableHighLow {
  high: number;
  low: number;
}

export type HighLow = Readonly<MutableHighLow>;

export abstract class HighLowType extends Base<HighLow> {
  public static readonly uint32: Uint32 = new Uint32();
  public static readonly bytes: number = 8;
  public readonly givenInitial: Option<Partial<HighLow>>;
  public readonly bytes: number = HighLowType.bytes;

  public coerce(hl?: Partial<HighLow>): Option<Partial<HighLow>> {
    if (typeof hl === 'object') {
      const high = HighLowType.uint32.coerce(hl.high);
      const low = HighLowType.uint32.coerce(hl.low);
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

  public create(...args: Partial<HighLow>[]): HighLow {
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

  public fromStreamChunk(chunk: ChunkBuffer, name: string = 'HighLow'): HighLow {
    return {
      low: chunk.readUint32(),
      high: chunk.readUint32(),
    };
  }

  public toStreamChunk(val: HighLow, chunk: ChunkBuffer, name: string = 'HighLow'): void {
    chunk.writeUint32(val.low);
    chunk.writeUint32(val.high);
  }

  public constructor(ival?: ScalarTypeArg<Partial<HighLow>>) {
    super();
    const val = (ival || {}).initial;
    this.givenInitial = this.coerce(val);
  }
}
