import { Option, SomeOption, NoneOption, OrUndefined, isSome } from '../optional';

import { Definition as Type, TypeName, ScalarTypeArg } from './type';

export class Definition implements Type<boolean> {
  public static readonly type: TypeName = 'Boolean';
  public static readonly bytes: number = 1;
  public readonly type: TypeName = Definition.type;
  public readonly bytes: number = Definition.bytes;
  // public readonly notRequire: boolean;
  // public readonly initial: boolean;
  public readonly givenInitial: Option<boolean>;
  public coerce(val: boolean | undefined): Option<boolean> {
    return typeof val === 'boolean' ? SomeOption(val) : NoneOption;
  }
  public create(...vals: boolean[]): boolean {
    return (
      vals.concat(OrUndefined(this.givenInitial)).find((i: boolean) => isSome(this.coerce(i))) ||
      false
    );
  }

  public constructor(arg?: ScalarTypeArg<boolean>) {
    const val = (arg || {}).initial;
    this.givenInitial = this.coerce(val);
    // this.initial = this.create(val);
  }
}

export type Boolean = Definition;
