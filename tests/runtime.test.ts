import { Runtime } from '../src/runtime';

test('FixedArray.create empty', () => {
  const my = Runtime.Types.FixedArray.create([], [3], [8, 9]);
  expect(my).toEqual([]);
});

test('FixedArray.create simple override 3', () => {
  const my = Runtime.Types.FixedArray.create([2], [3], [8, 9]);
  expect(my).toEqual([3, 9]);
});

test('FixedArray.create simple join 3,4', () => {
  const my = Runtime.Types.FixedArray.create([2], [3], [undefined, 4], [8, 9]);
  expect(my).toEqual([3, 4]);
});

 test('FixedArray.create [2,3]', () => {
     const init = [
        [1, 2, 3],
        [3, 4, 5],
     ];
    const my = Runtime.Types.FixedArray.create(
        [2, 3],
        [],
        init);
    // console.log(my);
    expect(my).toEqual(init);
 });

test('FixedArray.create [2,3,4]', () => {
  const lows = [[1, 2, 3, 4],
  [5, 6, 7, 8],
  [9, 10, 11, 12],
  [13, 14, 15, 16]];
  const init = Array(2).fill(Array(3).fill(lows));
  const my = Runtime.Types.FixedArray.create(
    [2, 3, 4],
    [],
    init
  );
  expect(my).toEqual(init);
});

// lengths: number[], ...vals: T[][]): T[]

// export namespace FixedArray {
//     // export type Type = []
//     export type Factory<T> = (idx: number) => T;

//     export function assign<T>(lengths: number[], lidx: number, ret: unknown[], val: unknown[]): unknown[] {
//       if (typeof lengths[lidx] !== 'number') {
//         for (let j = 0; j < Math.min(val.length, length); ++j) {
//           if (val[j] !== undefined) {
//             ret[j] = val[j];
//           }
//         }
//       } else {
//         for (let j = 0; j < lengths[lidx]; ++j) {
//           ret[j] = assign(lengths, lidx + 1, Array(lengths[lidx + 1]), (val[j] as unknown[] || []));
//         }
//       }
//       return ret;
//     }
//     export function create<
