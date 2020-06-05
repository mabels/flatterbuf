import { NumberType } from './number-type';
import { TypeName, ScalarTypeArg } from './base';
import { ChunkBuffer } from '../stream-buffer';

export type ValueType = number;

export class Definition extends NumberType {
  public static readonly type: TypeName = 'Short';
  public static readonly bytes: number = 2;
  public readonly type: TypeName = Definition.type;
  public readonly bytes: number = Definition.bytes;
  public constructor(arg: ScalarTypeArg<number> = {}) {
    super(arg, (v) => (~~v & 0x7fff) | ((v >= 0 ? 0 : 1) << 15));
  }
  public fromStreamChunk(chunk: ChunkBuffer, name: string = this.type): number {
    return chunk.readUint16();
  }
  public toStreamChunk(val: number, chunk: ChunkBuffer, name: string = this.type): void {
    chunk.writeUint16(val);
  }
}

export type Short = Definition;
