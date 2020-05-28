import { NumberType } from './number-type';
import { Definition as Type, TypeName, ScalarTypeArg } from './type';

export class Definition extends NumberType implements Type<number> {
    public static readonly type: TypeName = 'Uint8';
    public static readonly bytes: number = 1;
    public readonly type: TypeName = Definition.type;
    public readonly bytes: number = Definition.bytes;
    // public readonly notRequire: boolean;
    public constructor(arg: ScalarTypeArg<number> = {}) {
      super(arg, (v) => ~~v & 0xff);
    }
  }

  export type Uint8 = Definition;