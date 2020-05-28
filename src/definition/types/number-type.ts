import { Option, SomeOption, NoneOption, OrUndefined, isSome } from '../optional';
import { Definition, TypeName, ScalarTypeArg, FilterFunc } from './type';

export class NumberType {
  // public readonly initial: number;
  public readonly givenInitial: Option<number>;

  public coerce: FilterFunc<number>;

  public create(...vals: number[]): number {
    return vals.concat(OrUndefined(this.givenInitial)).find((i) => isSome(this.coerce(i))) || 0;
  }

  constructor(ival: ScalarTypeArg<number> | undefined, fn: (filter: number) => number) {
    const oval = (ival || {}).initial;
    this.coerce = (val: number | undefined) =>
      typeof val === 'number' ? SomeOption(fn(val)) : NoneOption;
    this.givenInitial = this.coerce(oval);
    // this.initial = this.create(ival);
  }
}
