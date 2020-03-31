import { Definition } from '../definition';

export namespace Runtime {
  type ReflectionAttributeType = { [attr: string]: Definition.Types.StructAttributeOfs<unknown> };
  export class Reflection<T> {
    public readonly attributes: ReflectionAttributeType = {};
    public readonly initial: T = {} as T;

    constructor(public readonly prop: Definition.Types.Struct) {
      this.prop.attributes.reduce((red, attr) => {
        red.attributes[attr.name] = attr;
        // order is relevant
        // console.log(`xxxx:${attr.name}:${attr.type.initial}:${red.propInitial}`)
        if (attr.type.initial != undefined) {
          (red.initial as any)[attr.name] = attr.type.initial;
        }
        if (red.propInitial[attr.name] != undefined) {
          (red.initial as any)[attr.name] = red.propInitial[attr.name];
        }
        return red;
      }, {
        attributes: this.attributes,
        initial: this.initial,
        propInitial: prop.initial || {}
      });
    }
  }

  export namespace Types {
    export namespace Boolean {
      export function create(...val: boolean[]): boolean {
        return val.find(i => typeof i === 'boolean') || false;
      }
    }
    export namespace Uint8 {
      export function create(...val: number[]): number {
        return val.find(i => typeof i === 'number') || 0;
      }
    }
    export const Uint16 = Uint8;
    export const Short = Uint8;
    export const Uint32 = Uint8;
    export const Int = Uint8;
    export const Float = Uint8;
    export const Double = Uint8;

    export namespace HighLow {
      export interface Type {
        readonly high: number;
        readonly low: number;
      }
      export function create(...args: Partial<Type>[]): Type {
        const data = args.filter(i => i || {}).concat({ high: 0, low: 0 }).reduce((r, i) => {
          if (typeof i.high === 'number') {
            r.high.push(i.high);
          }
          if (typeof i.low === 'number') {
            r.low.push(i.low);
          }
          return r;
        }, { high: [], low: [] });
        return {
          high: Uint32.create(...data.high),
          low: Uint32.create(...data.low)
        };
      }
      export const defaultValue = create();
      export function toStream(data: Partial<Type>, wb: StreamBuffer) {
        const hl = create(data);
        const c = wb.currentWriteChunk('HighLow', 8);
        c.writeUint32(hl.low);
        c.writeUint32(hl.high);
      }
      export function fromStream(wb: StreamBuffer) {
        const c = wb.currentReadChunk('HighLow', 8);
        return {
          low: c.readUint32(),
          high: c.readUint32(),
        };
      }
    }
    export const Uint64 = HighLow;
    export const Long = HighLow;

    export namespace FixedArray {
      // export type Type = []
      export type Factory<T> = (idx: number) => T;

      export function assign<T>(lengths: number[], lidx: number, ret: unknown[], val: unknown[]): unknown[] {
        if (typeof lengths[lidx + 1] !== 'number') {
          for (let j = 0; j < Math.min(val.length, ret.length); ++j) {
            if (val[j] !== undefined) {
              ret[j] = val[j];
            }
          }
          // console.log('end:', lidx, val.length, val, ret.length, ret);
        } else {
          for (let j = 0; j < ret.length; ++j) {
            assign(lengths, lidx + 1, ret[j] as unknown[], (val[j] as unknown[] || []));
          }
          // console.log('empty:', lidx, val.length, val, ret.length, ret);
        }
        return ret;
      }

      export function createArray(lengths: number[], idx = 0): unknown[] {
        if (idx < lengths.length) {
          return Array(lengths[idx]).fill(undefined).map(_ => {
            return createArray(lengths, idx + 1);
          });
        }
        return undefined;
      }

      export function create<T>(lengths: number[], ...vals: T[][]): T[] {
        // console.log('FixedArray.create(', length, vals, ')');
        // const ret = Array(length);

        // console.log('create:', lengths, vals);
        return vals
          .filter(i => Array.isArray(i))
          .reverse()
          .reduce((ret, val) => {
          // console.log('create:inner:', lengths, ret, val);
          return assign(lengths, 0, ret, val);
        }, (createArray(lengths) || []) as any);

        // for (let i = 0; i < length; ++i) {
        //   ret[i] = val(i);
        // }
        // return ret;
      }

      export function toStream<T>(length: number, wbf: Factory<T>) {
        for (let i = 0; i < length; ++i) {
          wbf(i);
        }
      }

      export function fromStream<T>(length: number, rb: Factory<T>): T[] {
        const ret = Array<T>(length);
        for (let i = 0; i < length; ++i) {
          ret[i] = rb(i);
        }
        return ret;
      }
    }
    export namespace Char {
      export function create(data?: string | number, def = 0): number {
        if (typeof data === 'string') {
          return data.charCodeAt(0) || 0;
        }
        if (typeof data === 'number') {
          return ~~data;
        }
        return def;
      }
    }

    export namespace FixedCString {
      export function create(length: number,
        ...vals: Definition.Types.FixedCStringInitType[]): number[] {
        const ret = Definition.Types.FixedCStringSetupInitial(length, ...vals);
        return ret;
      }
      export const fromStream = FixedArray.fromStream;
      export const toStream = FixedArray.fromStream;
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
    public writeChar(val: number) {
      this.writeUint8(val);
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
    public writeUint64(val: Types.HighLow.Type) {
      Types.HighLow.toStream(val, this.sbuf);
    }

    public writeLong(val: Types.HighLow.Type) {
      Types.HighLow.toStream(val, this.sbuf);
    }

    public writeDouble(val: number) {
      this.buffer.writeDoubleLE(val, this.ofs);
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
      return this.readUint8();
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
      return Types.HighLow.fromStream(this.sbuf);
    }
    public readLong() {
      return Types.HighLow.fromStream(this.sbuf);
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
      const buf = u8s.reduce(
        (b, u8) => {
          // console.log(b.ofs, u8);
          b.buf.set(u8, b.ofs);
          b.ofs += u8.length;
          return b;
        },
        { buf: Buffer.alloc(totalLen), ofs: 0 },
      );
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

    public prepareRead<T>(name: string, bytes: number, cb: (wb: ChunkBuffer) => T): T {
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
}
