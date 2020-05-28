import { Option, SomeOption, NoneOption, OrUndefined, isSome } from '../optional';

import { Type, TypeName, ScalarTypeArg } from './type';
// import { Definition  } from './boolean';

export type CharInitType = string | number;
export type CharScalarTypeArg = ScalarTypeArg<CharInitType>;

export class Definition implements Type<number> {
  public static readonly type: TypeName = 'Char';
  // public static readonly initial: 0;
  public static readonly bytes: number = 1;

  public readonly type: TypeName = Definition.type;
  public readonly bytes: number = Definition.bytes;
  // public readonly notRequire: boolean;
  // public readonly initial: number;
  public readonly givenInitial: Option<number>;

  public create(...vals: CharInitType[]): number {
    const found = vals.concat(OrUndefined(this.givenInitial)).find((val) => {
      const typ = typeof val;
      return typ === 'number' || typ === 'string';
    });
    if (typeof found === 'string') {
      return found.charCodeAt(0);
    }
    if (typeof found === 'number') {
      return ~~found;
    }
    return 0;
  }

  public coerce(v: CharInitType | undefined): Option<number> {
    if (typeof v === 'number') {
      return SomeOption(v);
    }
    if (typeof v === 'string') {
      return SomeOption(v.charCodeAt(0));
    }
    return NoneOption;
  }

  public constructor(arg?: CharScalarTypeArg) {
    const val = (arg || {}).initial;
    this.givenInitial = this.coerce(val);
    // this.initial = this.create(val);
    // console.log('Char=', arg, this.initial);
  }
}

export type Char = Definition;