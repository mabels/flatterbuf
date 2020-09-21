import { NumberType } from './number-type';
import { TypeName, ScalarTypeArg } from './base';
import { ChunkBuffer } from '../stream-buffer';

export type ValueType = number;

export class Definition extends NumberType {
  public static readonly type: TypeName = 'Uint32';
  public static readonly bytes: number = 4;
  // public static readonly create: typeof numberCreate = numberCreate;
  public readonly type: TypeName = Definition.type;
  public readonly bytes: number = Definition.bytes;
  public constructor(arg: ScalarTypeArg<number> = {}) {
    super(arg, (v) => ~~v & 0xffffffff);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public fromStreamChunk(chunk: ChunkBuffer, _name: string = this.type): number {
    return chunk.readUint32();
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public toStreamChunk(val: number, chunk: ChunkBuffer, _name: string = this.type): void {
    chunk.writeUint32(val);
  }
}

export type Uint32 = Definition;
