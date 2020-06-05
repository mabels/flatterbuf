import { HighLowType, HighLow, MutableHighLow } from './high-low';
import { TypeName, ScalarTypeArg } from './base';

export type Type = HighLow;
export type MutableType = MutableHighLow;
export type ValueType = HighLow;

export class Definition extends HighLowType {
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
