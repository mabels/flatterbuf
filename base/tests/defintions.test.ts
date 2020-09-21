// import { Definition } from '../src/definition';
import {
  FixArrayOfScalarType,
  FixArrayOfFixArrayScalarType,
  Samples,
  NestedArrayOfStruct,
} from '../src/samples';
import {Types, Optional} from '../src';
// import { HighLowType } from '../src/definition/types/high-low';
// import { Uint64, Base } from '../src/definition/types';

Types.SimpleScalarTypesList.forEach((scalar, len) => {
  test(`simple scalar ${scalar.type}`, () => {
    const my = new scalar();
    expect(my.bytes).toBe(scalar.bytes);
    expect(my.type).toBe(scalar.type);
  });

  test(`array of scalar ${scalar.type}`, () => {
    const my = FixArrayOfScalarType(len, () => new scalar());
    expect(my.bytes).toBe(len * scalar.bytes);
    expect(my.type).toBe(Types.FixedArray.Definition.type);
    expect(my.element.type).toBe(scalar.type);
  });
});

test(`Boolean scalar no initial`, () => {
  const my = new Types.Boolean.Definition();
  expect(my.create()).toBe(false);
});

test(`Boolean scalar initial`, () => {
  const my = new Types.Boolean.Definition({initial: true});
  expect(my.create()).toBe(true);
});

test(`Boolean scalar def initial`, () => {
  const my = new Types.Boolean.Definition({initial: true});
  expect(my.create(false)).toBe(false);
});

test(`UInt32 scalar no initial`, () => {
  const my = new Types.Uint32.Definition();
  expect(my.create()).toBe(0);
});

test(`UInt32 scalar initial`, () => {
  const my = new Types.Uint32.Definition({initial: 4711});
  expect(my.create()).toBe(4711);
});

test(`UInt32 scalard def initial`, () => {
  const my = new Types.Uint32.Definition({initial: 4711});
  expect(my.create(4712)).toBe(4712);
});

test(`Char scalar no initial`, () => {
  const my = new Types.Char.Definition();
  expect(my.create()).toBe(0);
});

test(`Char scalar initial string`, () => {
  const my = new Types.Char.Definition({initial: 'A'});
  expect(my.create()).toBe(65);
});

test(`Char scalard def initial string`, () => {
  const my = new Types.Char.Definition({initial: 'B'});
  expect(my.create('A')).toBe(65);
});

test(`Char scalar initial number`, () => {
  const my = new Types.Char.Definition({initial: 65});
  expect(my.create()).toBe(65);
});

test(`Char scalard def initial number`, () => {
  const my = new Types.Char.Definition({initial: 65});
  expect(my.create('B')).toBe(66);
});

test(`HighLow empty`, () => {
  const my = new Types.Uint64.Definition();
  expect(my.create()).toEqual({high: 0, low: 0});
});

test(`HighLow scalar initial number high`, () => {
  const my = new Types.Uint64.Definition({initial: {high: 65}});
  expect(my.create()).toEqual({high: 65, low: 0});
});
test(`HighLow scalar initial number low`, () => {
  const my = new Types.Uint64.Definition({initial: {low: 65}});
  expect(my.create()).toEqual({high: 0, low: 65});
});

test(`HighLow scalar initial number low:high`, () => {
  const my = new Types.Uint64.Definition({initial: {high: 66, low: 65}});
  expect(my.create()).toEqual({high: 66, low: 65});
});

test(`HighLow create initial number high`, () => {
  const my = new Types.Uint64.Definition({initial: {high: 65}});
  expect(my.create({}, {low: 67})).toEqual({high: 65, low: 67});
});
test(`HighLow create initial number low`, () => {
  const my = new Types.Uint64.Definition({initial: {low: 65}});
  expect(my.create({}, {high: 67})).toEqual({high: 67, low: 65});
});

test(`HighLow create initial number low:high`, () => {
  const my = new Types.Uint64.Definition({initial: {high: 66, low: 65}});
  expect(my.create({}, {high: 68}, {low: 69})).toEqual({high: 68, low: 69});
});
test(`HighLow create initial number low:high`, () => {
  const my = new Types.Uint64.Definition({initial: {high: 66, low: 65}});
  expect(my.create({high: 68, low: 69})).toEqual({high: 68, low: 69});
});

test(`nested arrays of scalar`, () => {
  const my = FixArrayOfFixArrayScalarType(19, 17);
  expect(my.bytes).toBe(19 * 17);
  expect(my.type).toBe(Types.FixedArray.Definition.type);
  const bdef = my.element as Types.FixedArray.Definition<boolean>;
  expect(bdef.type).toBe(Types.FixedArray.Definition.type);
  expect(bdef.bytes).toBe(17);
  expect(bdef.element.type).toBe(Types.Boolean.Definition.type);
});

test('structed of scalar types', () => {
  const my = Samples.StructOfScalar.Type;
  // console.log(my);
  expect(my.type).toBe(Types.Struct.Definition.type);
  expect(my.name).toBe('StructOfScalar');
  expect(my.bytes).toBe(Types.SimpleScalarTypesList.reduce((p, r) => p + r.bytes, 10 + 2));
  expect(my.attributes.length).toBe(Types.ScalarTypesList.length);
  expect(my.attributes.map((i) => i.name)).toEqual([
    ...Types.SimpleScalarTypesList.map((i) => `Name${i.type}`),
    'NameString',
    'NameBitStruct',
  ]);
});

test('struct of nested struct', () => {
  const my = Samples.StructOfNestedStruct.Type;
  expect(my.name).toBe('StructOfNestedStruct');
  expect(my.bytes).toBe(9);
  expect(my.attributes.length).toBe(2);
  expect(my.attributes[0].name).toBe('Yu');
  const maxAttribute = my.attributes[1];
  expect(maxAttribute.name).toBe('Max');
  const buxStruct = maxAttribute.type as Types.Struct.Definition;
  expect(buxStruct.name).toBe('Bux');
  expect(buxStruct.bytes).toBe(5);
  expect(buxStruct.attributes.length).toBe(2);
  expect(buxStruct.attributes[0].name).toBe('Zu');
  expect(buxStruct.attributes[1].name).toBe('Plax');
  const wurzStruct = buxStruct.attributes[1].type as Types.Struct.Definition;
  expect(wurzStruct.type).toBe('Struct');
  expect(wurzStruct.name).toBe('Wurx');
  expect(wurzStruct.alignFuncs).toEqual({element: 'byte', overall: 'byte'});
  expect(wurzStruct.attributes.length).toBe(1);
  expect(wurzStruct.attributes[0].name).toBe('Uhu');
  expect(wurzStruct.attributes[0].ofs).toBe(0);
  expect(wurzStruct.attributes[0].type.type).toBe('Char');
});

test('struct of nested array scalar', () => {
  const my = Samples.StructOfNestedArrayOfScalar.Type;
  expect(my.name).toBe('StructOfNestedArrayOfScalar');
  expect(my.bytes).toBe((2 * 3 * 4) + (10 * 10) + Types.SimpleScalarTypesList.reduce((r, i) => {
    return r + (i.bytes * 4);
  }, 0));
  expect(my.attributes.length).toBe(13);
  expect(my.attributes[0].name).toBe('Nested');
  expect(my.attributes[0].type.type).toBe('FixedArray');
  const arrayType = my.attributes[0].type as Types.FixedArray.Definition<unknown>;
  expect(arrayType.length).toBe(2);
  expect(arrayType.element.type).toBe('FixedArray');
  const arrayType1 = arrayType.element as Types.FixedArray.Definition<unknown>;
  expect(arrayType1.length).toBe(3);
  expect(my.attributes[1].name).toBe('FlatCstring');
  const arrayType3 = my.attributes[1].type as Types.FixedArray.Definition<unknown>;
  expect(arrayType3.length).toBe(10);
  expect(arrayType3.element.type).toBe('FixedCString');
});

test('struct of nested array struct', () => {
  const my = Samples.StructOfNestedArrayOfStruct.Type;
  expect(my.name).toBe('StructOfNestedArrayOfStruct');
  expect(my.bytes).toBe(1210);
  expect(my.attributes.length).toBe(2);
  expect(my.attributes[0].name).toBe('Nested');
  expect(my.attributes[0].type.type).toBe('FixedArray');
  const arrayType0 = my.attributes[0].type as Types.FixedArray.ArrayTypeAttribute<unknown>;
  expect(arrayType0.element.type).toBe('FixedArray');
  const arrayType = arrayType0.element as Types.FixedArray.ArrayTypeAttribute<unknown>;
  expect(arrayType.length).toBe(4);
  const structType = arrayType.element as Types.Struct.Definition;
  expect(structType.name).toBe('sonasNested');
  expect(structType.attributes.length).toBe(Types.ScalarTypesList.length);
  expect(structType.attributes[0].type.bytes).toBe(1);
  expect(structType.attributes[0].type.type).toBe('Boolean');
  expect(my.attributes[1].name).toBe('Flat');
  const arrayType1 = my.attributes[1].type as Types.FixedArray.ArrayTypeAttribute<unknown>;
  expect(arrayType1.type).toBe('FixedArray');
  expect(arrayType1.length).toBe(10);
  expect(arrayType1.element.type).toBe('Struct');
});

test('nested arrays of structed', () => {
  const my = NestedArrayOfStruct();
  expect(my.bytes).toBe(4);
  expect(my.element.type).toBe('Struct');
  const structType = my.element as Types.Struct.Definition;
  expect(structType.name).toBe('Bluchs');
  expect(structType.attributes.length).toBe(1);
  expect(structType.attributes[0].type.bytes).toBe(1);
  expect(structType.attributes[0].type.type).toBe('Boolean');
});

test('initial to fixed array scalar', () => {
  // console.log(`BLALAALAL`);
  // debugger;
  const m = new Types.FixedArray.Definition({
    length: 10,
    element: new Types.Int.Definition(),
    initial: [1, 4],
  });
  // expect(m.initial.length).toBe(10);
  expect(m.create()).toEqual([1, 4, 0, 0, 0, 0, 0, 0, 0, 0]);
});

test('initial to fixed array struct complete', () => {
  const m = new Types.FixedArray.Definition({
    length: 10,
    element: new Types.Struct.Definition({
      name: 'Bla',
      attributes: [
        {
          name: 'test',
          type: new Types.Int.Definition(),
        },
      ],
    }),
  });
  // expect(m.initial.length).toBe(10);
  expect(m.create()).toEqual(Array(10).fill({test: 0}));
});
test('initial to fixed array struct partial', () => {
  // The Partial test? is not right
  const m = new Types.FixedArray.Definition<{ test?: number}>({
    length: 10,
    element: new Types.Struct.Definition({
      name: 'Bla',
      attributes: [
        {
          name: 'test',
          type: new Types.Int.Definition(),
        },
      ],
    }),
    initial: [{test: 1}, {test: 2}],
  });
  // expect(m.initial.length).toBe(10);
  expect(m.create()).toEqual([{test: 1}, {test: 2}, ...Array(8).fill({test: 0})]);
});

test('initial from attribute type', () => {
  const m = new Types.Struct.Definition({
    name: 'Bla',
    attributes: [
      {
        name: 'test',
        type: new Types.Int.Definition({initial: 44}),
      },
    ],
  });
  expect(m.attributes[0].type.create()).toEqual(44);
  // expect(m.attributes[0].initial).toEqual(undefined);
  expect(m.givenInitial).toEqual(Optional.NoneOption);
  expect(m.create()).toEqual({test: 44});
});

test('initial passed by def struct', () => {
  const m = new Types.Struct.Definition({
    name: 'Bla',
    attributes: [
      {
        name: 'test',
        type: new Types.Int.Definition(),
      },
    ],
    initial: {bla: 1, test: 7},
  });
  expect(m.create()).toEqual({test: 7});
  expect(m.create({})).toEqual({test: 7});
  // debugger;
  expect(m.create({test: 1})).toEqual({test: 1});
  expect(m.create({}, {test: 3}, {test: 2})).toEqual({test: 3});
});

test('initial passed by create struct', () => {
  const m = new Types.Struct.Definition({
    name: 'Bla',
    attributes: [
      {
        name: 'test',
        type: new Types.Int.Definition(),
      },
    ],
  });
  expect(m.create()).toEqual({test: 0});
  expect(m.create({})).toEqual({test: 0});
  expect(m.attributeByName['test'].name).toBe('test');
  // debugger;
  expect(m.create({test: 1})).toEqual({test: 1});
  expect(m.create({}, {test: 3}, {test: 2})).toEqual({test: 3});
});

test('initial attribute struct merged', () => {
  const m = new Types.Struct.Definition({
    name: 'Bla',
    attributes: [
      {
        name: 'test0',
        type: new Types.Int.Definition(),
      },
      {
        name: 'test1',
        type: new Types.Int.Definition(),
      },
    ],
  });
  expect(m.create()).toEqual({test0: 0, test1: 0});
  expect(m.create({})).toEqual({test0: 0, test1: 0});
  expect(m.create({bla: 1})).toEqual({test0: 0, test1: 0});
  expect(m.create({test0: 1, test1: 2})).toEqual({test0: 1, test1: 2});
  // debugger;
  expect(m.create({test1: 1}, {test0: 2})).toEqual({test0: 2, test1: 1});
  expect(m.create({test0: 1}, {test1: 2})).toEqual({test0: 1, test1: 2});
  expect(m.create({}, {test1: 3}, {test0: 2}, {test0: 4, test1: 5})).toEqual({
    test0: 2,
    test1: 3,
  });
});

test('initial array', () => {
  const x = new Types.FixedArray.Definition({
    length: 4,
    element: new Types.Uint8.Definition({initial: 6}),
  });
  expect(x.create()).toEqual([6, 6, 6, 6]);
});
describe('initial array merge', () => {
  const x = new Types.FixedArray.Definition({
    length: 4,
    element: new Types.Uint8.Definition({initial: 6}),
    initial: [4, 4, 4, 4],
  });
  test('simple', () => {
    expect(x.create()).toEqual([4, 4, 4, 4]);
  });
  test('two partial', () => {
    expect(x.create([5, 6], [7, 5])).toEqual([5, 6, 4, 4]);
  });
  test('split two partial', () => {
    expect(x.create([5, undefined], [undefined, 6])).toEqual([5, 6, 4, 4]);
  });
  test('split partial completed', () => {
    expect(x.create([5, undefined], undefined, [7, 6])).toEqual([5, 6, 4, 4]);
  });
});

test('initial nested array merge', () => {
  const x = new Types.FixedArray.Definition({
    length: 4,
    element: new Types.FixedArray.Definition<number>({
      length: 2,
      element: new Types.Uint8.Definition({initial: 6}),
    }),
    initial: Array(4)
        .fill([0, 0])
        .map((_, i) => [3 + i, 3 + i]),
  });
  expect(x.create()).toEqual([
    [3, 3],
    [4, 4],
    [5, 5],
    [6, 6],
  ]);
  expect(x.create([undefined, [5, 6]], [undefined, [7, 5]])).toEqual([
    [3, 3],
    [5, 6],
    [5, 5],
    [6, 6],
  ]);
  expect(x.create([undefined, [5, undefined]], [undefined, [undefined, 6]])).toEqual([
    [3, 3],
    [5, 6],
    [5, 5],
    [6, 6],
  ]);
  expect(x.create([undefined, [5, undefined]], [undefined, [7, 6]])).toEqual([
    [3, 3],
    [5, 6],
    [5, 5],
    [6, 6],
  ]);
});

test('initial outer struct', () => {
  const m = new Types.Struct.Definition({
    name: 'Bla',
    attributes: [
      {
        name: 'test',
        type: new Types.Int.Definition({initial: 44}),
        // initial: 49,
      },
    ],
    initial: {test: 59},
  });
  expect(m.attributes[0].type.create()).toEqual(44);
  // expect(m.attributes[0].initial).toEqual(49);
  expect(m.create()).toEqual({test: 59});
});
// test('array init', () => {});

test('default init char', () => {
  const m = new Types.Char.Definition();
  expect(m.create()).toBe(0);
});

test('string init char', () => {
  const m = new Types.Char.Definition({initial: 'A'});
  expect(m.create()).toBe('A'.charCodeAt(0));
});

test('number init char', () => {
  const m = new Types.Char.Definition({initial: 66});
  expect(m.create()).toBe(66);
});

test('default to fixedcstring', () => {
  const m = new Types.FixedCString.Definition({
    length: 10,
  });
  // expect(m.initial.length).toBe(10);
  expect(m.create()).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
});

test('default to fixedcstring string', () => {
  const ref = 'ABCDEFGHIJK';
  const m = new Types.FixedCString.Definition({
    length: 10,
    initial: ref,
  });
  // expect(m.initial.length).toBe(10);
  const x = Array.from(ref)
      .slice(0, 10)
      .map((i) => i.charCodeAt(0));
  x[x.length - 1] = 0;
  expect(m.create()).toEqual(x);
});

[
  {initial: undefined, compare: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]},
  {initial: [0, 0, 0, 0, 0, 0, 0, 0, 12, 13, 14], compare: [0, 0, 0, 0, 0, 0, 0, 0, 12, 0]},
  {initial: 'HalloHallo', compare: [72, 97, 108, 108, 111, 72, 97, 108, 108, 0]},
  {initial: 'Hallo', compare: [72, 97, 108, 108, 111, 0, 0, 0, 0, 0]},
].forEach((v, i) => {
  describe('fixedcstring string', () => {
    const m = new Types.FixedCString.Definition({
      length: 10,
      initial: v.initial,
    });
    test(`create ${v.initial}`, () => {
      // if (i == 1) debugger;
      const c = m.create();
      expect(c).toEqual(v.compare);
    });
    test(`create with value: ${v.initial}`, () => {
      const c = new Types.FixedCString.Definition({length: 10}).create(v.initial);
      expect(c).toEqual(v.compare);
    });
    // test(`${v.initial}`, () => {
    //   expect(m.length).toBe(10);
    //   expect(m.cr).toEqual(v.compare);
    // });
  });
});

test(`create with multiple value`, () => {
  const c = new Types.FixedCString.Definition({length: 10}).create(
      [1, 2, 3],
      [4, 5, 6, 7],
      [7, 8, 9, 10, 11],
  );
  expect(c).toEqual([1, 2, 3, 7, 11, 0, 0, 0, 0, 0]);
});

test(`create with undefined multiple values value`, () => {
  const c = new Types.FixedCString.Definition({length: 10}).create(
      undefined,
      [1, 2, 3],
      undefined,
      [4, 5, 6, 7],
      undefined,
      [7, 8, 9, 10, 11],
      Array(10).fill(undefined),
  );
  expect(c).toEqual([1, 2, 3, 7, 11, 0, 0, 0, 0, 0]);
});

test('range error bit fields', () => {
  expect(
      () =>
        new Types.BitStruct.Definition({
        // length: 1,
          bits: [
            {
              name: '_1_1bit',
              start: 0,
              length: 10,
            },
          ],
        }),
  ).toThrowError('BitStruct:_1_1bit');
});

test('double defined in bits', () => {
  expect(
      () =>
        new Types.BitStruct.Definition({
        // length: 1,
          bits: [
            {
              name: '_1_1bit',
              start: 0,
              length: 10,
            },
            {
              name: '_1_1bit',
              start: 0,
              length: 10,
            },
          ],
        }),
  ).toThrowError('double definied');
});

test('simple bit fields', () => {
  // console.log(`Hello World`);
  // debugger;
  const m = new Types.BitStruct.Definition({
    bits: [
      {
        name: '_1_1bit',
        start: 0,
      },
      {
        name: '_2_2bit',
        start: 1,
        length: 2,
        initial: 2,
      },
      {
        name: '_3_3bit',
        start: 3,
        length: 3,
      },
      {
        name: '_6_2bit',
        start: 6,
        length: 2,
      },
    ],
  });
  expect(m.type).toBe('BitStruct');
  expect(m.name).toBe('_1_1bitS0L1__2_2bitS1L2__3_3bitS3L3__6_2bitS6L2');
  expect(m.length).toBe(1);
  expect(m.bits.length).toBe(4);
  expect(m.bits[0]).toEqual({
    name: '_1_1bit',
    start: 0,
    length: 1,
    type: {
      bytes: 1,
      givenInitial: {
        none: true,
      },
      // initial: false,
      type: 'Boolean',
    },
  });
  expect(m.bits[1]).toEqual({
    // initial: 2,
    name: '_2_2bit',
    start: 1,
    length: 2,
    type: {
      bytes: 4,
      coerce: (m.bits[1] as any).type.coerce,
      givenInitial: {
        none: false,
        some: 2,
      },
      // initial: 2,
      type: 'Uint32',
    },
  });
  expect(Optional.isNone(m.givenInitial)).toBeTruthy();
  expect(m.create()).toEqual({
    _1_1bit: false,
    _2_2bit: 2,
    _3_3bit: 0,
    _6_2bit: 0,
  });
});

test('simple bit fields', () => {
  const m = new Types.BitStruct.Definition({
    bits: [
      {
        name: '_1_1bit',
        start: 0,
      },
      {
        name: '_2_2bit',
        start: 1,
        length: 2,
        initial: 2,
      },
      {
        name: '_3_3bit',
        start: 3,
        length: 3,
      },
      {
        name: '_6_2bit',
        start: 6,
        length: 2,
      },
    ],
    initial: {
      _2_2bit: 3,
    },
  });
  expect(m.type).toBe('BitStruct');
  expect(m.name).toBe('_1_1bitS0L1__2_2bitS1L2__3_3bitS3L3__6_2bitS6L2');
  expect(m.length).toBe(1);
  expect(m.bits.length).toBe(4);
  expect(m.bits[0]).toEqual({
    name: '_1_1bit',
    start: 0,
    length: 1,
    type: {
      bytes: 1,
      givenInitial: {
        none: true,
      },
      // initial: false,
      type: 'Boolean',
    },
  });
  expect(m.bits[1]).toEqual({
    // initial: 2,
    name: '_2_2bit',
    start: 1,
    length: 2,
    type: {
      bytes: 4,
      coerce: (m.bits[1] as any).type.coerce,
      givenInitial: {
        none: false,
        some: 2,
      },
      // initial: 2,
      type: 'Uint32',
    },
  });
  expect(Optional.isSome(m.givenInitial)).toBeTruthy();
  if (Optional.isSome(m.givenInitial)) {
    expect(m.givenInitial.some).toEqual({
      _2_2bit: 3,
    });
  }
  expect(m.create()).toEqual({
    _1_1bit: false,
    _2_2bit: 3,
    _3_3bit: 0,
    _6_2bit: 0,
  });
});

test('longer bit fields', () => {
  const m = new Types.BitStruct.Definition({
    length: 6,
    bits: [
      {
        name: '_6_32bit',
        start: 6,
        length: 32,
      },
    ],
    initial: {_6_32bit: 0x47114711},
  });
  expect(m.length).toBe(6);
  // console.log(m);
  expect(m.create()).toEqual({
    _6_32bit: 0x47114711,
  });
});
