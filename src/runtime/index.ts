import { Types } from '../definition';

// export namespace Runtime {
//   // // type ReflectionStructAttributeType = { [attr: string]: Definition.Types.StructAttributeOfs<unknown> };
//   // export interface ReflectionStruct<A, I> extends Definition.Types.Type<Partial<I>> {
//   //   readonly attributes: A;
//   //   readonly initial: I;

//   //   clone(prop: { initial?: Partial<I>}): ReflectionStruct<A, I>;

//   //   // constructor(public readonly prop: Definition.Types.Struct) {
//   //   //   this.prop.attributes.reduce((red, attr) => {
//   //   //     red.attributes[attr.name] = attr;
//   //   //     // order is relevant
//   //   //     // console.log(`xxxx:${attr.name}:${attr.type.initial}:${red.propInitial}`)
//   //   //     if (attr.type.initial != undefined) {
//   //   //       (red.initial as any)[attr.name] = attr.type.initial;
//   //   //     }
//   //   //     if (red.propInitial[attr.name] != undefined) {
//   //   //       (red.initial as any)[attr.name] = red.propInitial[attr.name];
//   //   //     }
//   //   //     return red;
//   //   //   }, {
//   //   //     attributes: this.attributes,
//   //   //     initial: this.initial,
//   //   //     propInitial: prop.initial || {}
//   //   //   });
//   //   // }
//   // }

//   // // type ReflectionBitStructAttributeType = { [attr: string]: Definition.Types.BitItemWithLength };
//   // export interface ReflectionBitStruct<B, I> extends Definition.Types.Type<Partial<I>> {
//   //   // public readonly bits: ReflectionStructAttributeType = {};
//   //   readonly bits: B;
//   //   // public readonly initial: Definition.Types.BitStructInitial = {};
//   //   readonly initial: Partial<I>;

//   //   // // initialMerge(target: Definition.Types.BitStructInitial)

//   //   // constructor(public readonly prop: Definition.Types.BitStruct) {
//   //   //   this.prop.bits.reduce((red, bit) => {
//   //   //     // red.attributes[bit.name] = bit;
//   //   //     // order is relevant
//   //   //     // console.log(`xxxx:${attr.name}:${attr.type.initial}:${red.propInitial}`)
//   //   //     if (bit.initial !== undefined) {
//   //   //       red.initial[bit.name] = bit.initial;
//   //   //     }
//   //   //     if (red.propInitial[bit.name] !== undefined) {
//   //   //       red.initial[bit.name] = red.propInitial[bit.name];
//   //   //     }
//   //   //     return red;
//   //   //   }, {
//   //   //     bits: this.bits,
//   //   //     initial: this.initial,
//   //   //     propInitial: prop.initial || {}
//   //   //   });
//   //   //   // console.log('XXXX=>', this.initial, prop.initial);
//   //   // }

//   //   create(...vals: Partial<I>[]): ReflectionBitStruct<B, I>;
//   //   // public create(prop: { initial?: Definition.Types.BitStructInitial}) {
//   //   //   return new Definition.Types.BitStruct({
//   //   //     ...this.prop,
//   //   //     initial: {...this.prop.initial, ...prop.initial}
//   //   //    });
//   //   // }
//   // }

//   export namespace Types {
//     export namespace HighLow {
//       // export function partialSet(hl: Partial<Type>, cb: (hl: Partial<Type>) => void) {
//       //   const ret: any = {};
//       //   if (typeof hl.high === 'number') {
//       //     ret.high = hl.high;
//       //   }
//       //   if (typeof hl.low === 'number') {
//       //     ret.low = hl.low;
//       //   }
//       //   return ret;
//       // }
//       export function toStream(data: Partial<Types.HighLow>, wb: StreamBuffer) {
//         const hl = (new Definition.Types.HighLowType()).create(data);
//         const c = wb.currentWriteChunk('HighLow', 8);
//         c.writeUint32(hl.low);
//         c.writeUint32(hl.high);
//       }
//       export function fromStream(wb: StreamBuffer) {
//         const c = wb.currentReadChunk('HighLow', 8);
//         return {
//           low: c.readUint32(),
//           high: c.readUint32(),
//         };
//     }
//   }
//     export const Uint64 = HighLow;
//     export const Long = HighLow;

//     // export namespace BitStruct {
//     //   export type Type = { [key: string ]: number };
//     //   export function create(...args: Partial<Type>[]): Type {
//     //     // const data = args.filter(i => i || {}).concat({ high: 0, low: 0 }).reduce((r, i) => {
//     //     //   if (typeof i.high === 'number') {
//     //     //     r.high.push(i.high);
//     //     //   }
//     //     //   if (typeof i.low === 'number') {
//     //     //     r.low.push(i.low);
//     //     //   }
//     //     //   return r;
//     //     // }, { high: [], low: [] });
//     //     // return {
//     //     //   high: Uint32.create(...data.high),
//     //     //   low: Uint32.create(...data.low)
//     //     // };
//     //     return {};
//     //   }
//     //   export const defaultValue = create();
//     //   export function toStream(data: Partial<Type>, wb: StreamBuffer) {
//     //     const hl = create(data);
//     //     const c = wb.currentWriteChunk('HighLow', 8);
//     //     c.writeUint32(hl.low);
//     //     c.writeUint32(hl.high);
//     //   }
//     //   export function fromStream(wb: StreamBuffer) {
//     //     const c = wb.currentReadChunk('HighLow', 8);
//     //     return {
//     //       low: c.readUint32(),
//     //       high: c.readUint32(),
//     //     };
//     //   }
//     // }



//     export namespace FixedCString {
//       export function partialSet(bytes: number,
//         val: Definition.Types.FixedCStringInitType | undefined,
//         cb: (hl: Definition.Types.FixedCStringInitType) => void) {
//         if (val === undefined) {
//           return;
//         }
//         if (typeof val === 'string') {
//           cb(val.substr(0, bytes));
//         } else if (Array.isArray(val)) {
//           cb(val.slice(0, bytes));
//         }
//       }

//       export function fromStream({length, bytes}: { length: number, bytes: number}, rb: ChunkBuffer): number[] {
//         const ret = Array<number>(length).fill(0);
//         for (let i = 0; i < bytes; ++i) {
//           const val = rb.readUint8();
//           if (i < length) {
//             ret[i] = val;
//           }
//         }
//         return ret;
//       }
//       export function toStream({bytes}: { length: number, bytes: number}, val: number[], wb: ChunkBuffer) {
//         for (let i = 0; i < bytes; ++i) {
//           wb.writeUint8(val[i] || 0);
//         }
//       }
//     }
//   }

// }
