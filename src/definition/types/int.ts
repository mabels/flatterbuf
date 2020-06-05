import { NumberType } from './number-type';
import { TypeName, ScalarTypeArg } from './base';
import { ChunkBuffer } from '../stream-buffer';

export type ValueType = number;

export class Definition extends NumberType {
  public static readonly type: TypeName = 'Int';
  public static readonly bytes: number = 4;
  // public static readonly create: typeof numberCreate = numberCreate;
  public readonly type: TypeName = Definition.type;
  public readonly bytes: number = Definition.bytes;
  // public readonly notRequire: boolean;
  public constructor(arg: ScalarTypeArg<number> = {}) {
    super(arg, (v) => (~~v & 0x7fffffff) | ((v >= 0 ? 0 : 1) << 31));
  }
  public fromStreamChunk(chunk: ChunkBuffer, name: string = this.type): number {
    return chunk.readUint32();
  }
  public toStreamChunk(val: number, chunk: ChunkBuffer, name: string = this.type): void {
    chunk.writeUint32(val);
  }
}

export type Int = Definition;
