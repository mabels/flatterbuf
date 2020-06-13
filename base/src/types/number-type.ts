import { Option, SomeOption, NoneOption, OrUndefined, isSome } from '../optional';
import { TypeName, ScalarTypeArg, FilterFunc, Definition } from './base';

export abstract class NumberType extends Definition<number> {
  // public readonly initial: number;
  public readonly givenInitial: Option<number>;

  public abstract bytes: number;
  public abstract type: TypeName;
  public coerce: FilterFunc<number>;

  public create(...vals: number[]): number {
    return vals.concat(OrUndefined(this.givenInitial)).find((i) => isSome(this.coerce(i))) || 0;
  }

  constructor(ival: ScalarTypeArg<number> | undefined, fn: (filter: number) => number) {
    super();
    const oval = (ival || {}).initial;
    this.coerce = (val: number | undefined) =>
      typeof val === 'number' ? SomeOption(fn(val)) : NoneOption;
    this.givenInitial = this.coerce(oval);
  }
}
