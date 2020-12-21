import { Option, SomeOption, NoneOption, OrUndefined } from '../optional';

import { Definition as Base, TypeName, ScalarTypeArg } from './base';
import { ChunkBuffer } from '../stream-buffer';

export type ValueType = number;

export type CharInitType = string | number;
export type CharScalarTypeArg = ScalarTypeArg<CharInitType>;

export class Definition extends Base<number> {
  public static readonly type: TypeName = 'Char';
  public static readonly bytes: number = 1;

  public readonly type: TypeName = Definition.type;
  public readonly bytes: number = Definition.bytes;
  public readonly givenInitial: Option<number>;

  public create(...vals: CharInitType[]): number {
    const found = vals
      .concat(OrUndefined(this.givenInitial) || [])
      .find((val) => {
        const typ = typeof val;
        return typ === 'number' || typ === 'string';
      });
    if (typeof found === 'string') {
      return found.charCodeAt(0);
    }
    if (typeof found === 'number') {
      return ~~found;
    }
    return 0;
  }

  public coerce(v: CharInitType | undefined): Option<number> {
    if (typeof v === 'number') {
      return SomeOption(v);
    }
    if (typeof v === 'string') {
      return SomeOption(v.charCodeAt(0));
    }
    return NoneOption;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public fromStreamChunk(chunk: ChunkBuffer, _name: string = this.type): number {
    return chunk.readUint8();
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public toStreamChunk(val: number, chunk: ChunkBuffer, _name: string = this.type): void {
    chunk.writeUint8(val);
  }

  public constructor(arg?: CharScalarTypeArg) {
    super();
    const val = (arg || {}).initial;
    this.givenInitial = this.coerce(val);
  }
}

export type Char = Definition;
