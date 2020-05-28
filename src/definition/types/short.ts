import { NumberType } from './number-type';
import { Definition as Type, TypeName, ScalarTypeArg } from './type';


export class Definition extends NumberType implements Type<number> {
    public static readonly type: TypeName = 'Short';
    public static readonly bytes: number = 2;
    public readonly type: TypeName = Definition.type;
    public readonly bytes: number = Definition.bytes;
    public constructor(arg: ScalarTypeArg<number> = {}) {
      super(arg, (v) => (~~v & 0x7fff) | ((v >= 0 ? 0 : 1) << 15));
    }
  }

  export type Short = Definition;