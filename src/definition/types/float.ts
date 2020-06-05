import { NumberType } from './number-type';
import { TypeName, ScalarTypeArg } from './base';
import { ChunkBuffer } from '../stream-buffer';

export type ValueType = number;

export class Definition extends NumberType {
  public static readonly type: TypeName = 'Float';
  public static readonly bytes: number = 4;
  // public static readonly create: typeof numberCreate = numberCreate;
  public readonly type: TypeName = Definition.type;
  public readonly bytes: number = Definition.bytes;
  public constructor(arg: ScalarTypeArg<number> = {}) {
    super(arg, (v) => v);
  }
  public fromStreamChunk(chunk: ChunkBuffer, name: string = this.type): number {
    return chunk.readFloat();
  }
  public toStreamChunk(val: number, chunk: ChunkBuffer, name: string = this.type): void {
    chunk.writeFloat(val);
  }
}

export type Float = Definition;
