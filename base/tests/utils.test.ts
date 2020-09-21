import {nestedAssign} from '../src/utils';
import {NoneOption, SomeOption} from '../src/optional';

test('scalar empty', () => {
  expect(nestedAssign('my', {})).toEqual(NoneOption);
});
test('scalar empty undefined', () => {
  expect(nestedAssign('my', {}, undefined)).toEqual(NoneOption);
  expect(nestedAssign('my', {}, undefined, undefined)).toEqual(NoneOption);
});
test('scalar empty uniform', () => {
  expect(() => nestedAssign('my', {}, 1, undefined, 'o' as any)).toThrow();
});

test('scalar empty one, scalar', () => {
  const v = {};
  expect(nestedAssign('my', v, 1)).toEqual(SomeOption({my: 1}));
  expect(v).toEqual({my: 1});
});
test('scalar empty two, scalar', () => {
  const v = {};
  expect(nestedAssign('my', v, 1, 2)).toEqual(SomeOption({my: 1}));
  expect(v).toEqual({my: 1});
});
test('scalar empty undefined scalar', () => {
  const v = {};
  expect(nestedAssign('my', v, undefined, 1)).toEqual(SomeOption({my: 1}));
  expect(v).toEqual({my: 1});
});

test('scalar empty undefined scalar', () => {
  const v = {};
  expect(nestedAssign('my', v, 1, undefined)).toEqual(SomeOption({my: 1}));
  expect(v).toEqual({my: 1});
});

test('empty nestedAssign', () => {
  expect(nestedAssign(undefined, {}, [], [], [])).toBe(NoneOption);
});

test('empty nestedAssign', () => {
  expect(nestedAssign(undefined, {}, {}, {}, {})).toBe(NoneOption);
});

test('empty nestedAssign', () => {
  const v = {p: 1, o: 0, u: 5};
  expect(nestedAssign<{}>(undefined, v, {o: 1}, {u: 2}, {o: 2, u: 3})).toStrictEqual(
      SomeOption({p: 1, o: 1, u: 2}),
  );
  expect(v).toStrictEqual({p: 1, o: 1, u: 2});
});

test('empty nestedAssign', () => {
  expect(nestedAssign('doof', {}, [], [], [])).toBe(NoneOption);
});

test('empty nestedAssign', () => {
  expect(nestedAssign('doof', {}, {}, {}, {})).toBe(NoneOption);
});

test('empty nestedAssign', () => {
  const v = {doof: {p: 7, o: 8}};
  expect(nestedAssign<{}>('doof', v, {o: 1}, {u: 2}, {o: 2, u: 3})).toStrictEqual(
      SomeOption({doof: {p: 7, o: 1, u: 2}}),
  );
  expect(v).toStrictEqual({doof: {p: 7, o: 1, u: 2}});
});
test('empty undefined nestedAssign', () => {
  const v = {};
  expect(nestedAssign<{}>('doof', v, {o: 1}, {u: 2}, {o: 2, u: 3})).toStrictEqual(
      SomeOption({doof: {o: 1, u: 2}}),
  );
  expect(v).toStrictEqual({doof: {o: 1, u: 2}});
});

test('empty {{}} nestedAssign', () => {
  const v = {};
  expect(
      nestedAssign<{}>('doof', v, {o: {x: 1}}, {u: 2}, {o: {x: 3, y: 9}, u: 3}),
  ).toStrictEqual(SomeOption({doof: {o: {x: 1, y: 9}, u: 2}}));
  expect(v).toStrictEqual({doof: {o: {x: 1, y: 9}, u: 2}});
});

test(`[]`, () => {
  expect(nestedAssign<[]>(undefined, undefined, [], [])).toEqual(NoneOption);
});

test(`[undefined, undefined]`, () => {
  expect(nestedAssign<[]>(undefined, undefined, [undefined], [undefined, undefined])).toEqual(
      NoneOption,
  );
});

test(`[[1, undefined], [undefined, 2]]`, () => {
  expect(nestedAssign<[]>(undefined, undefined, [1, undefined], [undefined, 2])).toEqual(
      SomeOption([1, 2]),
  );
});

test(`[[{a:1, b: 2}, {a: 3, c: 4}], [{a: 3, b: 1, c: 4}, { b: 5 }]]`, () => {
  expect(
      nestedAssign<[]>(
          undefined,
          undefined,
          [
            {a: 1, b: 2},
            {a: 3, c: 4},
          ],
          [{a: 3, b: 1, c: 4}, {b: 5}, {u: 4}],
      ),
  ).toEqual(SomeOption([{a: 1, b: 2, c: 4}, {a: 3, b: 5, c: 4}, {u: 4}]));
});

test(`[[undefined, 2], [1, 5, undefined], [ 3, 2, 1, 4]]`, () => {
  expect(
      nestedAssign<[]>(undefined, undefined, [undefined, 2], [1, 5, undefined], [3, 2, 1, 4]),
  ).toEqual(SomeOption([1, 2, 1, 4]));
});

test('empty {[]{[]}} nestedAssign', () => {
  const v = {};
  debugger;
  const result = SomeOption({doof: {
    a: [1, 2, 5],
    l: [{u: 4, q: 5, p: 7, r: 9}],
    p: 9,
    u: 3,
    o: {d: [1, 5], x: 1, y: 9},
  }});
  expect(
      nestedAssign<{}>(
          'doof',
          v,
          {a: [1, 2], l: [{u: 4, q: 5}], o: {d: [1], x: 1}},
          {l: [{u: 5, q: 7, r: 9}], p: 9},
          {a: [3, 4, 5], l: [{u: 9, q: 9, p: 7}], o: {d: [9, 5], x: 3, y: 9}, u: 3},
      ),
  ).toStrictEqual(result);
  expect(v).toStrictEqual(result.some);
});
