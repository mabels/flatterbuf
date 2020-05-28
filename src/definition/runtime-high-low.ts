import { HighLow, HighLowType } from './types/high-low';
import { StreamBuffer } from './stream-buffer';

    export function toStream(data: Partial<HighLow>, wb: StreamBuffer) {
      const hl = new HighLowType().create(data);
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
