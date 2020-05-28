import { Option, SomeOption, NoneOption, OrUndefined, isSome } from '../optional';
import { Definition, TypeName, ScalarTypeArg } from './type';
import { Definition as Uint32 } from './uint32';

export interface HighLow {
  readonly high: number;
  readonly low: number;
}

export class HighLowType {
  public static readonly uint32: Uint32 = new Uint32();
  // public readonly initial: HighLow;
  public readonly givenInitial: Option<Partial<HighLow>>;

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
  public constructor(ival?: ScalarTypeArg<Partial<HighLow>>) {
    const val = (ival || {}).initial;
    this.givenInitial = this.coerce(val);
    // this.initial = this.create(val);
  }
}
