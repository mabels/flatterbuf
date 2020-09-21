import {NumberType} from './number-type';
import {TypeName, ScalarTypeArg} from './base';
import {ChunkBuffer} from '../stream-buffer';

export type ValueType = number;

export class Definition extends NumberType {
  public static readonly type: TypeName = 'Double';
  public static readonly bytes: number = 8;
  // public static readonly create: typeof numberCreate = numberCreate;
  public readonly type: TypeName = Definition.type;
  public readonly bytes: number = Definition.bytes;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public fromStreamChunk(chunk: ChunkBuffer, _name: string = this.type): number {
    return chunk.readDouble();
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public toStreamChunk(val: number, chunk: ChunkBuffer, _name: string = this.type): void {
    chunk.writeDouble(val);
  }
  public constructor(arg: ScalarTypeArg<number> = {}) {
    super(arg, (v) => v);
  }
}

export type Double = Definition;
