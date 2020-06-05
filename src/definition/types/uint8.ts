import { NumberType } from './number-type';
import { TypeName, ScalarTypeArg } from './base';
import { ChunkBuffer } from '../stream-buffer';

export type ValueType = number;

export class Definition extends NumberType {
  public static readonly type: TypeName = 'Uint8';
  public static readonly bytes: number = 1;
  public readonly type: TypeName = Definition.type;
  public readonly bytes: number = Definition.bytes;
  // public readonly notRequire: boolean;
  public constructor(arg: ScalarTypeArg<number> = {}) {
    super(arg, (v) => ~~v & 0xff);
  }
  public fromStreamChunk(chunk: ChunkBuffer, name: string = this.type): number {
    return chunk.readUint8();
  }
  public toStreamChunk(val: number, chunk: ChunkBuffer, name: string = this.type): void {
    chunk.writeUint8(val);
  }
}

export type Uint8 = Definition;
