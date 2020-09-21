import { Option } from '../optional';
import { NestedPartial } from '../nested';
import { ChunkBuffer, StreamBuffer } from '../stream-buffer';

export type TypeName =
  | 'Boolean'
  | 'Uint8'
  | 'Char'
  | 'Uint16'
  | 'Short'
  | 'Uint32'
  | 'Int'
  | 'Float'
  | 'Uint64'
  | 'Long'
  | 'Double'
  | 'FixedArray'
  | 'FixedCString'
  | 'Struct'
  | 'BitStruct';

export type FilterFunc<T> = (val: T | undefined) => Option<T>;
export type CreateFunc<T> = (...vals: Partial<T>[]) => T;

export abstract class Definition<T> {
  public abstract readonly type: TypeName;
  public abstract readonly bytes: number;
  public abstract readonly givenInitial: Option<unknown>;
  public abstract coerce(val: unknown): Option<unknown>;
  public abstract create(...vals: (undefined | T | NestedPartial<T>)[]): T;

  public abstract fromStreamChunk(chunk: ChunkBuffer, name: string): T;
  public abstract toStreamChunk(val: T, chunk: ChunkBuffer, name: string): void;

  // public abstract new(): Definition<T>;

  public fromStream(rb: StreamBuffer, name: string): T {
    return rb.prepareRead(name, this.bytes, (nrb) => this.fromStreamChunk(nrb, name));
  }

  public toStream(val: T, buf: StreamBuffer, name: string = this.type): StreamBuffer {
    return buf.prepareWrite(name, this.bytes, (wb) => this.toStreamChunk(val, wb, name));
  }
}

// export type Type<T> = Definition<T>;

export interface ScalarTypeArg<T> {
  readonly initial?: T;
}

export abstract class NamedType<T> extends Definition<T> {
  public abstract readonly name: string;
}
