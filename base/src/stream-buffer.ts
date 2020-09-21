export class ChunkBuffer {
  constructor(
    public readonly name: string,
    public readonly bytes: number,
    public readonly sbuf: StreamBuffer,
    public readonly buffer = Buffer.alloc(bytes),
    public ofs = 0,
  ) {}

  public writeBoolean(val: boolean): void {
    // console.log('writeBoolean:', val);
    this.buffer.writeUInt8(~~val, this.ofs);
    this.ofs += 1;
  }
  public writeUint8(val: number): void {
    this.buffer.writeUInt8(~~val, this.ofs);
    this.ofs += 1;
  }
  public writeChar(val: number): void {
    this.writeUint8(val);
  }
  public writeUint16(val: number): void {
    this.buffer.writeUInt16LE(val, this.ofs);
    this.ofs += 2;
  }
  public writeShort(val: number): void {
    this.buffer.writeInt16LE(val, this.ofs);
    this.ofs += 2;
  }
  public writeUint32(val: number): void {
    this.buffer.writeUInt32LE(val, this.ofs);
    this.ofs += 4;
  }
  public writeInt(val: number): void {
    // console.log('writeInt', val, ~~val, this.ofs);
    this.buffer.writeInt32LE(~~val, this.ofs);
    this.ofs += 4;
  }
  public writeFloat(val: number): void {
    this.buffer.writeFloatLE(val, this.ofs);
    this.ofs += 4;
  }
  // public writeUint64(val: HighLow) {
  //   HighLow(val, this.sbuf);
  // }

  // public writeLong(val: HighLow) {
  //   HighLowToStream(val, this.sbuf);
  // }

  public writeDouble(val: number): void {
    this.buffer.writeDoubleLE(val, this.ofs);
    this.ofs += 8;
  }

  public readBoolean(): boolean {
    const ret = this.buffer.readUInt8(this.ofs);
    this.ofs += 1;
    return !!ret;
  }
  public readUint8(): number {
    const ret = this.buffer.readUInt8(this.ofs);
    this.ofs += 1;
    return ret;
  }
  public readChar(): number {
    return this.readUint8();
  }
  public readUint16(): number {
    const ret = this.buffer.readUInt16LE(this.ofs);
    this.ofs += 2;
    return ret;
  }
  public readShort(): number {
    const ret = this.buffer.readInt16LE(this.ofs);
    this.ofs += 2;
    return ret;
  }
  public readUint32(): number {
    const ret = this.buffer.readUInt32LE(this.ofs);
    this.ofs += 4;
    return ret;
  }
  public readInt(): number {
    const ret = this.buffer.readUInt32LE(this.ofs);
    // console.log('readInt', ret, this.ofs);
    this.ofs += 4;
    return ret;
  }
  public readFloat(): number {
    const ret = this.buffer.readFloatLE(this.ofs);
    this.ofs += 4;
    return ret;
  }
  public readDouble(): number {
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
        {buf: Buffer.alloc(totalLen), ofs: 0},
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

  public prepareWrite(name: string, bytes: number, cb: (wb: ChunkBuffer) => void): StreamBuffer {
    const buffer = this.currentWriteChunk(name, bytes);
    cb(buffer);
    return this;
  }

  public asUint8Array(): Uint8Array {
    const totalLen = this.buffers.reduce((r, i) => r + i.buffer.length, 0);
    const out = new Uint8Array(totalLen);
    this.buffers.reduce((r, b) => {
      out.set(b.buffer, r);
      return r + b.buffer.length;
    }, 0);
    return out;
  }
}
