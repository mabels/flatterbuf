import { nestedAssign } from '../src/definition/utils';
import { NoneOption, SomeOption } from '../src/definition/optional';

test('scalar empty', () => {
  const v = {};
  expect(nestedAssign('my', {})).toEqual(NoneOption);
});
test('scalar empty undefined', () => {
  const v = {};
  expect(nestedAssign('my', {}, undefined)).toEqual(NoneOption);
  expect(nestedAssign('my', {}, undefined, undefined)).toEqual(NoneOption);
});
test('scalar empty uniform', () => {
  const v = {};
  expect(() => nestedAssign('my', {}, 1, undefined, 'o' as any)).toThrow();
});

test('scalar empty one, scalar', () => {
  const v = {};
  expect(nestedAssign('my', v, 1)).toEqual(SomeOption({ my: 1 }));
  expect(v).toEqual({ my: 1 });
});
test('scalar empty two, scalar', () => {
  const v = {};
  expect(nestedAssign('my', v, 1, 2)).toEqual(SomeOption({ my: 1 }));
  expect(v).toEqual({ my: 1 });
});
test('scalar empty undefined scalar', () => {
  const v = {};
  expect(nestedAssign('my', v, undefined, 1)).toEqual(SomeOption({ my: 1 }));
  expect(v).toEqual({ my: 1 });
});

test('scalar empty undefined scalar', () => {
  const v = {};
  expect(nestedAssign('my', v, 1, undefined)).toEqual(SomeOption({ my: 1 }));
  expect(v).toEqual({ my: 1 });
});

test('empty nestedAssign', () => {
  expect(nestedAssign(undefined, {}, [], [], [])).toBe(NoneOption);
});

test('empty nestedAssign', () => {
  expect(nestedAssign(undefined, {}, {}, {}, {})).toBe(NoneOption);
});

test('empty nestedAssign', () => {
  const v = { p: 1, o: 0, u: 5 };
  expect(nestedAssign<{}>(undefined, v, { o: 1 }, { u: 2 }, { o: 2, u: 3 })).toStrictEqual(
    SomeOption({ p: 1, o: 1, u: 2 }),
  );
  expect(v).toStrictEqual({ p: 1, o: 1, u: 2 });
});

test('empty nestedAssign', () => {
  expect(nestedAssign('doof', {}, [], [], [])).toBe(NoneOption);
});

test('empty nestedAssign', () => {
  expect(nestedAssign('doof', {}, {}, {}, {})).toBe(NoneOption);
});

test('empty nestedAssign', () => {
  const v = { doof: { p: 7, o: 8 } };
  expect(nestedAssign<{}>('doof', v, { o: 1 }, { u: 2 }, { o: 2, u: 3 })).toStrictEqual(
    SomeOption({ doof: { p: 7, o: 1, u: 2 } }),
  );
  expect(v).toStrictEqual({ doof: { p: 7, o: 1, u: 2 } });
});
test('empty undefined nestedAssign', () => {
  const v = {};
  debugger;
  expect(nestedAssign<{}>('doof', v, { o: 1 }, { u: 2 }, { o: 2, u: 3 })).toStrictEqual(
    SomeOption({ doof: { o: 1, u: 2 } }),
  );
  expect(v).toStrictEqual({ doof: { o: 1, u: 2 } });
});

test('empty {{}} nestedAssign', () => {
  const v = {};
  expect(
    nestedAssign<{}>('doof', v, { o: { x: 1 } }, { u: 2 }, { o: { x: 3, y: 9 }, u: 3 }),
  ).toStrictEqual(SomeOption({ doof: { o: { x: 1, y: 9}, u: 2 } }));
  expect(v).toStrictEqual({ doof: { o: { x: 1, y: 9}, u: 2 } });
});

// test('empty nones', () => {
//     expect(nestedAssign(NoneOption)).toBe(NoneOption);
//     expect(nestedAssign(NoneOption, NoneOption)).toBe(NoneOption);
// });

// test('empty object merge', () => {
//     expect(nestedAssign(SomeOption({}), SomeOption({}))).toEqual(NoneOption);
// });

// test('scalar object merge', () => {
//     expect(nestedAssign(SomeOption({o: 1}))).toEqual(SomeOption({ o: 1}));
//     expect(nestedAssign(SomeOption({}), SomeOption({o: 1}), SomeOption({o: 2}))).toEqual(SomeOption({ o: 1}));
//     expect(nestedAssign(SomeOption({}), SomeOption({o: 1}), SomeOption({q: 2}))).toEqual(SomeOption({ o: 1, q: 2}));
//     expect(nestedAssign(SomeOption({}), SomeOption({o: 1}), SomeOption({o: 2, q: 2}))).toEqual(SomeOption({ o: 1, q: 2}));
// });
