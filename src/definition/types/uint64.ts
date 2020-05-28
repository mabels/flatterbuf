import { HighLowType, HighLow } from './high-low';
import { TypeName, Type as _Type, ScalarTypeArg } from './type';

export type Type = HighLow;

export class Definition extends HighLowType implements _Type<HighLow> {
    public static readonly type: TypeName = 'Uint64';
    public static readonly bytes: number = 8;
    // public static readonly create: typeof HighLow.create = HighLow.create;
    public readonly type: TypeName = Definition.type;
    public readonly bytes: number = Definition.bytes;
    public constructor(arg?: ScalarTypeArg<Partial<HighLow>>) {
      super(arg);
    }
  }

  export type Uint64 = Definition;
