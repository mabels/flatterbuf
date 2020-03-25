import { create } from 'domain';
import { Definition } from '../definition';

export namespace Runtime {
  // export enum ReflectionType {
  //   Struct,
  //   Ushort,
  //   Uchar,
  //   Uint,
  //   ULong,
  //   Float,
  //   Double,
  //   Int64,
  //   Vector,
  // }
  // export interface ReflectionAttribute<T = unknown> {
  //   readonly name: string;
  //   readonly type: Definition.Types.TypeName;
  //   readonly ofs: number;
  //   readonly bytes: number;
  //   readonly notRequired: boolean;
  //   readonly elements?: number;
  //   readonly element?: ReflectionAttribute<T>;
  //   readonly initial?: T;
  // }
  // export interface ReflectionProps {
  //   self: ReflectionAttribute;
  //   attributes: ReflectionAttribute[];
  // }
  export class Reflection {
    constructor(public readonly prop: Definition.Types.Struct) {}
  }

  // export interface ReadStreamBuffer {
  //   readUshort(): Promise<number>;
  //   readFloat(): Promise<number>;
  //   readUchar(): Promise<number>;
  //   readUint(): Promise<number>;
  //   readInt64(): Promise<BigInt>;
  // }

  export namespace HighLow {
    export interface Type {
      readonly high: number;
      readonly low: number;
    }
    export function create(data: Partial<Type> = { high: 0, low: 0 }): Type {
      return {
        high: data && typeof data.high === 'number' ? data.high : 0,
        low: data && typeof data.low === 'number' ? data.low : 0,
      };
    }
    export const defaultValue = create();
    export function toStream(
      data: Partial<Type>,
      wb: StreamBuffer
    ) {
        const hl = create(data);
        const c = wb.currentWriteChunk('HighLow', 8);
        c.writeUint32(hl.low);
        c.writeUint32(hl.high);
    }
    export function fromStream(wb: StreamBuffer) {
      const c = wb.currentReadChunk('HighLow', 8);
      return {
        low: c.readUint32(),
        high: c.readUint32()
      }
    }
  }

  export class ChunkBuffer {
    constructor(
      public readonly name: string,
      public readonly bytes: number,
      public readonly sbuf: StreamBuffer,
      public readonly buffer = Buffer.alloc(bytes),
      public ofs = 0,
    ) {}

    public writeBoolean(val: Boolean) {
      // console.log('writeBoolean:', val);
      this.buffer.writeUInt8(~~val, this.ofs);
      this.ofs += 1;
    }
    public writeUint8(val: number) {
      this.buffer.writeUInt8(~~val, this.ofs);
      this.ofs += 1;
    }
    public writeChar(val: string) {
      this.buffer.writeInt8(val.charCodeAt(0), this.ofs);
      this.ofs += 1;
    }
    public writeUint16(val: number) {
      this.buffer.writeUInt16LE(val, this.ofs);
      this.ofs += 2;
    }
    public writeShort(val: number) {
      this.buffer.writeInt16LE(val, this.ofs);
      this.ofs += 2;
    }
    public writeUint32(val: number) {
      this.buffer.writeUInt32LE(val, this.ofs);
      this.ofs += 4;
    }
    public writeInt(val: number) {
      // console.log('writeInt', val, ~~val, this.ofs);
      this.buffer.writeInt32LE(~~val, this.ofs);
      this.ofs += 4;
    }
    public writeFloat(val: number) {
      this.buffer.writeFloatLE(val, this.ofs);
      this.ofs += 4;
    }
    public writeUint64(val: HighLow.Type) {
      // if (this.buffer.writeBigUInt64BE) {
      //     this.buffer.writeBigUInt64BE(val, this.ofs);
      // } else {
      // const my = this.ofs;
      HighLow.toStream(val, this.sbuf);
      // console.log(`OFS`, my, this.ofs);
      // this.buffer.writeUInt32LE(val.high, this.ofs + 4);
      // this.buffer.writeUInt32LE(val.low, this.ofs);
      // }
      // this.ofs += 8;
    }
    public writeLong(val: HighLow.Type) {
      HighLow.toStream(val, this.sbuf);
      // this.buffer.writeBigInt64LE(val, this.ofs);
      // this.buffer.writeUInt32LE(val.high, this.ofs + 4);
      // this.buffer.writeUInt32LE(val.low, this.ofs);
      // this.ofs += 8;
    }
    public writeDouble(val: number) {
      this.buffer.writeDoubleLE(~~val, this.ofs);
      this.ofs += 8;
    }

    public readBoolean() {
      const ret = this.buffer.readUInt8(this.ofs);
      this.ofs += 1;
      return !!ret;
    }
    public readUint8() {
      const ret = this.buffer.readUInt8(this.ofs);
      this.ofs += 1;
      return ret;
    }
    public readChar() {
      const ret = this.buffer.readInt8(this.ofs);
      this.ofs += 1;
      return String.fromCharCode(ret);
    }
    public readUint16() {
      const ret = this.buffer.readUInt16LE(this.ofs);
      this.ofs += 2;
      return ret;
    }
    public readShort() {
      const ret = this.buffer.readInt16LE(this.ofs);
      this.ofs += 2;
      return ret;
    }
    public readUint32() {
      const ret = this.buffer.readUInt32LE(this.ofs);
      this.ofs += 4;
      return ret;
    }
    public readInt() {
      const ret = this.buffer.readUInt32LE(this.ofs);
      // console.log('readInt', ret, this.ofs);
      this.ofs += 4;
      return ret;
    }
    public readFloat() {
      const ret = this.buffer.readFloatLE(this.ofs);
      this.ofs += 4;
      return ret;
    }
    public readUint64() {
      // if (this.buffer.writeBigUInt64BE) {
      //     this.buffer.writeBigUInt64BE(val, this.ofs);
      // } else {
      return HighLow.fromStream(this.sbuf);
      // this.buffer.writeUInt32LE(val.high, this.ofs + 4);
      // this.buffer.writeUInt32LE(val.low, this.ofs);
      // }
    }
    public readLong() {
      return HighLow.fromStream(this.sbuf);
      // HighLow.toStream(val, this);
      // this.buffer.writeBigInt64LE(val, this.ofs);
      // this.buffer.writeUInt32LE(val.high, this.ofs + 4);
      // this.buffer.writeUInt32LE(val.low, this.ofs);
      // this.ofs += 8;
    }
    public readDouble() {
      const ret = this.buffer.readDoubleLE(this.ofs);
      this.ofs += 8;
      return ret;
    }
  }
  export class StreamBuffer {
    public buffers: ChunkBuffer[] = [];

    public constructor(u8s: Uint8Array[] = []) {
      const totalLen = u8s.reduce((r, u8) => r + u8.length, 0);
      const buf = u8s.reduce((b, u8) => {
        // console.log(b.ofs, u8);
        b.buf.set(u8, b.ofs);
        b.ofs += u8.length;
        return b;
      }, { buf: Buffer.alloc(totalLen), ofs: 0 });
      if (totalLen > 0) {
        // console.log('Read:', totalLen, buf.buf);
        this.buffers.push(new ChunkBuffer('reader', totalLen, this, buf.buf, 0));
      }
    }

    public currentWriteChunk(name: string, bytes: number): ChunkBuffer {
      let lastPos = this.buffers.length - 1;
      let last: ChunkBuffer;
      if (lastPos >= 0) {
        last = this.buffers[lastPos];
        if (last.ofs + bytes > last.bytes) {
          // not nice but fast
          lastPos = -1;
        }
      }
      if (lastPos < 0) {
        last = new ChunkBuffer(name, bytes, this);
        this.buffers.push(last);
      }
      return last;
    }

    public currentReadChunk(name: string, bytes: number): ChunkBuffer {
      const c = this.buffers[this.buffers.length - 1];
      if (c.ofs + bytes > c.bytes) {
        throw Error(`currentReadChunk: ${name}-${bytes}`);
      }
      return c;
    }

    public prepareRead<T>(
      name: string,
      bytes: number,
      cb: (wb: ChunkBuffer) => T,
    ): T {
      return cb(this.currentReadChunk(name, bytes));
    }

    public prepareWrite<T>(
      name: string,
      bytes: number,
      cb: (wb: ChunkBuffer) => void,
    ): StreamBuffer {
      const buffer = this.currentWriteChunk(name, bytes);
      cb(buffer);
      return this;
    }

    public asUint8Array() {
      const totalLen = this.buffers.reduce((r, i) => r + i.buffer.length, 0);
      const out = new Uint8Array(totalLen);
      this.buffers.reduce((r, b) => {
        out.set(b.buffer, r);
        return r + b.buffer.length;
      }, 0);
      return out;
    }

  }

  //   export function Resolver<T, O>(name: string, val: T, bs: ReadStreamBuffer, cb: () => Promise<O>): Promise<O> {
  //     return cb();
  //   }

  //   export function Intercept<T>(name: string, val: T, bs: WriteStreamBuffer, cb: () => Promise<unknown>): Promise<unknown> {
  //     return cb();
  //   }

  //   export function ReadArrayFn<T>(len: number, dst: T[], cb: () => Promise<T>): () => Promise<unknown> {
  //     return () => {
  //       const ps = Array(len).fill(undefined).map(async (_, idx) => dst[idx] = await cb());
  //       return Promise.all(ps)
  //     }
  //   }

  //   export type TypedArrays = Uint8Array|Uint16Array|Uint32Array;
  //   export function ReadTypedArrayFn(len: number, dst: TypedArrays, cb: () => Promise<number>): () => Promise<unknown> {
  //     return () => {
  //       const ps = Array(len).fill(undefined).map(async (_, idx) => dst[idx] = await cb());
  //       return Promise.all(ps)
  //     }
  //   }
}
