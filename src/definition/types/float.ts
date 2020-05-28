import { NumberType } from './number-type';
import { Definition as Type, TypeName, ScalarTypeArg } from './type';

export class Definition extends NumberType implements Type<number> {
  public static readonly type: TypeName = 'Float';
  public static readonly bytes: number = 4;
  // public static readonly create: typeof numberCreate = numberCreate;
  public readonly type: TypeName = Definition.type;
  public readonly bytes: number = Definition.bytes;
  public constructor(arg: ScalarTypeArg<number> = {}) {
    super(arg, (v) => v);
  }
}

export type Float = Definition;
