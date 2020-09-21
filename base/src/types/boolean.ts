import { Option, SomeOption, NoneOption, OrUndefined, isSome } from '../optional';

import { Definition as Base, TypeName, ScalarTypeArg } from './base';
import { ChunkBuffer } from '../stream-buffer';

export type ValueType = boolean;

export class Definition extends Base<boolean> {
  public static readonly type: TypeName = 'Boolean';
  public static readonly bytes: number = 1;
  public readonly type: TypeName = Definition.type;
  public readonly bytes: number = Definition.bytes;
  public readonly givenInitial: Option<boolean>;

  public coerce(val: boolean | undefined): Option<boolean> {
    return typeof val === 'boolean' ? SomeOption(val) : NoneOption;
  }

  public create(...vals: boolean[]): boolean {
    return (
      vals.concat(OrUndefined(this.givenInitial)).find((i: boolean) => isSome(this.coerce(i))) ||
      false
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public fromStreamChunk(chunk: ChunkBuffer, _name: string = this.type): boolean {
    return chunk.readBoolean();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public toStreamChunk(val: boolean, chunk: ChunkBuffer, _name: string = this.type): void {
    chunk.writeBoolean(val);
  }

  public constructor(arg?: ScalarTypeArg<boolean>) {
    super();
    const val = (arg || {}).initial;
    this.givenInitial = this.coerce(val);
    // this.initial = this.create(val);
  }
}

export type Boolean = Definition;
