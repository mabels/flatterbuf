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

