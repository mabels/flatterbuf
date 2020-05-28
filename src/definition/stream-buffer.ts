import { HighLow, HighLowType } from './types/high-low';

function HighLowToStream(data: Partial<HighLow>, wb: StreamBuffer) {
  const hl = new HighLowType().create(data);
  const c = wb.currentWriteChunk('HighLow', 8);
  c.writeUint32(hl.low);
  c.writeUint32(hl.high);
}
function HighLowFromStream(wb: StreamBuffer) {
  const c = wb.currentReadChunk('HighLow', 8);
  return {
    low: c.readUint32(),
    high: c.readUint32(),
  };
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
  public writeUint64(val: HighLow) {
    HighLowToStream(val, this.sbuf);
  }

  public writeLong(val: HighLow) {
    HighLowToStream(val, this.sbuf);
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
    return HighLowFromStream(this.sbuf);
  }
  public readLong() {
    return HighLowFromStream(this.sbuf);
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

  public prepareWrite<T>(name: string, bytes: number, cb: (wb: ChunkBuffer) => void): StreamBuffer {
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
