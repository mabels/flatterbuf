import { Generator } from '../src/generator';
import { Definition } from '../src/definition';
import {
  FixArrayOfScalarType,
  FixArrayOfFixArrayScalarType,
  Samples,
  NestedArrayOfStruct,
} from './samples';

// test('empty type', () => {
//   const fb = Generator.fromString('');
//   expect(fb.js.diagnostics).toEqual([]);
//   expect(fb.js.outputText).toEqual('');
//   expect(() => eval(fb.js.outputText)).not.toThrow();
// });

Definition.Types.ScalarTypesList.forEach((scalar, len) => {
  test(`simple scalar ${scalar.type}`, () => {
    const my = new scalar();
    expect(my.bytes).toBe(scalar.bytes);
    expect(my.type).toBe(scalar.type);
  });

  test(`array of scalar ${scalar.type}`, () => {
    const my = FixArrayOfScalarType(len, scalar);
    expect(my.bytes).toBe(len * scalar.bytes);
    expect(my.type).toBe(Definition.Types.FixedArray.type);
    expect(my.element.type).toBe(scalar.type);
  });
});

test(`nested arrays of scalar`, () => {
  const my = FixArrayOfFixArrayScalarType(19, 17);
  expect(my.bytes).toBe(19 * 17);
  expect(my.type).toBe(Definition.Types.FixedArray.type);
  const bdef = my.element as Definition.Types.FixedArray<boolean>;
  expect(bdef.type).toBe(Definition.Types.FixedArray.type);
  expect(bdef.bytes).toBe(17);
  expect(bdef.element.type).toBe(Definition.Types.Boolean.type);
});

test('structed of scalar types', () => {
  const my = Samples.StructOfScalar.Type;
  // console.log(my);
  expect(my.type).toBe(Definition.Types.Struct.type);
  expect(my.name).toBe('StructOfScalar');
  expect(my.bytes).toBe(Definition.Types.ScalarTypesList.reduce((p, r) => p + r.bytes, 10));
  expect(my.attributes.length).toBe(Definition.Types.ScalarTypesList.length + 1);
  expect(my.attributes.map(i => i.name)).toEqual([
    ...Definition.Types.ScalarTypesList.map(i => `Name${i.type}`),
    'NameString',
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
  const buxStruct = maxAttribute.type as Definition.Types.Struct;
  expect(buxStruct.name).toBe('Bux');
  expect(buxStruct.bytes).toBe(5);
  expect(buxStruct.attributes.length).toBe(2);
  expect(buxStruct.attributes[0].name).toBe('Zu');
  expect(buxStruct.attributes[1].name).toBe('Plax');
  const wurzStruct = buxStruct.attributes[1].type as Definition.Types.Struct;
  expect(wurzStruct.type).toBe('Struct');
  expect(wurzStruct.name).toBe('Wurx');
  expect(wurzStruct.alignFuncs).toEqual({ element: 'byte', overall: 'byte' });
  expect(wurzStruct.attributes.length).toBe(1);
  expect(wurzStruct.attributes[0].name).toBe('Uhu');
  expect(wurzStruct.attributes[0].ofs).toBe(0);
  expect(wurzStruct.attributes[0].type.type).toBe('Char');
});

test('struct of nested array scalar', () => {
  const my = Samples.StructOfNestedArrayOfScalar.Type;
  expect(my.name).toBe('StructOfNestedArrayOfScalar');
  expect(my.bytes).toBe(2 * 3 * 4 + 10);
  expect(my.attributes.length).toBe(2);
  expect(my.attributes[0].name).toBe('Nested');
  expect(my.attributes[0].type.type).toBe('FixedArray');
  const arrayType = my.attributes[0].type as Definition.Types.FixedArray<unknown>;
  expect(arrayType.length).toBe(2);
  expect(arrayType.element.type).toBe('FixedArray');
  const arrayType1 = arrayType.element as Definition.Types.FixedArray<unknown>;
  expect(arrayType1.length).toBe(3);
  expect(my.attributes[1].name).toBe('Flat');
  const arrayType2 = my.attributes[1].type as Definition.Types.FixedArray<unknown>;
  expect(arrayType2.length).toBe(10);
  expect(arrayType2.element.type).toBe('Char');
});

test('struct of nested array struct', () => {
  const my = Samples.StructOfNestedArrayOfStruct.Type;
  expect(my.name).toBe('StructOfNestedArrayOfStruct');
  expect(my.bytes).toBe(1166);
  expect(my.attributes.length).toBe(2);
  expect(my.attributes[0].name).toBe('Nested');
  expect(my.attributes[0].type.type).toBe('FixedArray');
  const arrayType0 = my.attributes[0].type as Definition.Types.ArrayTypeAttribute<unknown>;
  expect(arrayType0.element.type).toBe('FixedArray');
  const arrayType = arrayType0.element as Definition.Types.ArrayTypeAttribute<unknown>;
  expect(arrayType.length).toBe(4);
  const structType = arrayType.element as Definition.Types.Struct;
  expect(structType.name).toBe('sonasNested');
  expect(structType.attributes.length).toBe(Definition.Types.ScalarTypesList.length + 1);
  expect(structType.attributes[0].type.bytes).toBe(1);
  expect(structType.attributes[0].type.type).toBe('Boolean');
  expect(my.attributes[1].name).toBe('Flat');
  const arrayType1 = my.attributes[1].type as Definition.Types.ArrayTypeAttribute<unknown>;
  expect(arrayType1.type).toBe('FixedArray');
  expect(arrayType1.length).toBe(10);
  expect(arrayType1.element.type).toBe('Struct');
});

test('nested arrays of structed', () => {
  const my = NestedArrayOfStruct();
  expect(my.bytes).toBe(4);
  expect(my.element.type).toBe('Struct');
  const structType = my.element as Definition.Types.Struct;
  expect(structType.name).toBe('Bluchs');
  expect(structType.attributes.length).toBe(1);
  expect(structType.attributes[0].type.bytes).toBe(1);
  expect(structType.attributes[0].type.type).toBe('Boolean');
});

test('initial to fixed array scalar', () => {
  const m = new Definition.Types.FixedArray({
    length: 10,
    element: new Definition.Types.Int(),
    initial: [1, 4],
  });
  expect(m.initial.length).toBe(10);
  expect(m.initial).toEqual([1, 4, 0, 0, 0, 0, 0, 0, 0, 0]);
});

test('initial to fixed array struct', () => {
  const m = new Definition.Types.FixedArray({
    length: 10,
    element: new Definition.Types.Struct({
      name: 'Bla',
      attributes: [
        {
          name: 'test',
          type: new Definition.Types.Int(),
        },
      ],
    }),
    initial: [{ test: 1 }, { test: 2 }],
  });
  expect(m.initial.length).toBe(10);
  expect(m.initial).toEqual([{ test: 1 }, { test: 2 }, ...Array(8).fill({ test: 0 })]);
});

test('initial to fixed array struct', () => {
  const m = new Definition.Types.Struct({
    name: 'Bla',
    attributes: [
      {
        name: 'test',
        type: new Definition.Types.Int({ initial: 44 }),
      },
    ],
  });
  expect(m.initial).toEqual({ test: 44 });
});

test('initial to fixed array struct', () => {
  const m = new Definition.Types.Struct({
    name: 'Bla',
    attributes: [
      {
        name: 'test',
        type: new Definition.Types.Int({ initial: 44 }),
        initial: 49,
      },
    ],
  });
  expect(m.initial).toEqual({ test: 49 });
});

test('array init', () => {});

test('default init char', () => {
  const m = new Definition.Types.Char();
  expect(m.initial).toBe(0);
});

test('string init char', () => {
  const m = new Definition.Types.Char({ initial: 'A' });
  expect(m.initial).toBe('A'.charCodeAt(0));
});

test('number init char', () => {
  const m = new Definition.Types.Char({ initial: 66 });
  expect(m.initial).toBe(66);
});

test('default to fixedcstring', () => {
  const m = new Definition.Types.FixedCString({
    length: 10,
  });
  // expect(m.initial.length).toBe(10);
  expect(m.initial).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
});

test('default to fixedcstring string', () => {
  const ref = 'ABCDEFGHIJK';
  const m = new Definition.Types.FixedCString({
    length: 10,
    initial: ref,
  });
  // expect(m.initial.length).toBe(10);
  const x = Array.from(ref)
    .slice(0, 10)
    .map(i => i.charCodeAt(0));
  x[x.length - 1] = 0;
  expect(m.initial).toEqual(x);
});

test('default to fixedcstring array', () => {
  const m = new Definition.Types.FixedCString({
    length: 10,
    initial: Array(12).map((_, i) => i),
  });
  // expect(m.initial.length).toBe(10);
  expect(m.initial).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
});

[
  { initial: undefined, compare: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { initial: [0, 0, 0, 0, 0, 0, 0, 0, 12, 13, 14], compare: [0, 0, 0, 0, 0, 0, 0, 0, 12, 0] },
  { initial: 'HalloHallo', compare: [72, 97, 108, 108, 111, 72, 97, 108, 108, 0] },
  { initial: 'Hallo', compare: [72, 97, 108, 108, 111, 0, 0, 0, 0, 0] },
].forEach(v => {
  describe('fixedcstring string', () => {
    test(`${v.initial}`, () => {
      const m = new Definition.Types.FixedCString({
        length: 10,
        initial: v.initial,
      });
      expect(m.initial.length).toBe(10);
      expect(m.initial).toEqual(v.compare);
    });
  });
});

// test('simple fixed len string("utf-8")', () => {
//   const m = new Definition.Types.Struct({
//     name: 'Test',
//     attributes: [
//       {
//         name: 'String',
//         type: new Definition.Types.FixedCString({ length: 10, initial: 'Katze' })
//       }
//     ]
//   });

// });

test('simple bit fields', () => {
  // for (int i = 0; i < 32; ++i) {
  //   const fb = FlatterBuf.generate({
  //     type: FlatterBuf.Types.BitField,
  //     union: Array(i).fill(undefined).map(_ => {
  //     })
  //       name:
  //     startBit: i,
  //     bits: 1
  //   });
  //   expect(fb.type).toBe(FlatterBuf.Types.BitField);
  // }
});
