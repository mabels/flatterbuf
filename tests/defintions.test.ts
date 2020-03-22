import { Generator } from '../src/generator';
import { Definition } from '../src/definition';
import {
  FixArrayOfScalarType,
  FixArrayOfFixArrayScalarType,
  StructOfScalar,
  StructOfNestedStruct,
  StructOfNestedArrayOfScalar,
  StructOfNestedArrayOfStruct,
  NestedArrayOfStruct,
} from './samples';

test('empty type', () => {
  const fb = Generator.fromString('');
  expect(fb.js.diagnostics).toEqual([]);
  expect(fb.js.outputText).toEqual('');
  expect(() => eval(fb.js.outputText)).not.toThrow();
});

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
  expect(my.element.type).toBe(Definition.Types.FixedArray.type);
  expect(my.element.bytes).toBe(17);
  expect((my.element as Definition.Types.FixedArray).element.type).toBe(Definition.Types.Boolean.type);
});

test('structed of scalar types', () => {
  const my = StructOfScalar();
  // console.log(my);
  expect(my.type).toBe(Definition.Types.Struct.type);
  expect(my.name).toBe('HansWurst');
  expect(my.bytes).toBe(Definition.Types.ScalarTypesList.reduce((p, r) => p + r.bytes, 0));
  expect(my.attributes.length).toBe(Definition.Types.ScalarTypesList.length);
  expect(my.attributes.map(i => i.name)).toEqual(
    Definition.Types.ScalarTypesList.map(i => `Name${i.type}`),
  );
});

test('struct of nested struct', () => {
  const my = StructOfNestedStruct();
  expect(my.name).toBe('HansWurst');
  expect(my.bytes).toBe(1);
  expect(my.attributes.length).toBe(1);
  const maxAttribute = my.attributes[0];
  expect(maxAttribute.name).toBe('Max');
  const buxStruct = maxAttribute.type as Definition.Types.Struct;
  expect(buxStruct.name).toBe('Bux');
  expect(buxStruct.bytes).toBe(1);
  expect(buxStruct.attributes.length).toBe(1);
  expect(buxStruct.attributes[0].name).toBe('Plax');
  expect(buxStruct.attributes[0].type.type).toBe('Boolean');
});

test('struct of nested array scalar', () => {
  const my = StructOfNestedArrayOfScalar();
  expect(my.name).toBe('HansWurst');
  expect(my.bytes).toBe(6);
  expect(my.attributes.length).toBe(1);
  expect(my.attributes[0].name).toBe('Bytes');
  expect(my.attributes[0].type.type).toBe('FixedArray');
  const arrayType = my.attributes[0].type as Definition.Types.FixedArray;
  expect(arrayType.element.type).toBe('Boolean');
});

test('struct of nested array struct', () => {
  const my = StructOfNestedArrayOfStruct();
  expect(my.name).toBe('HansWurst');
  expect(my.bytes).toBe(6);
  expect(my.attributes.length).toBe(1);
  expect(my.attributes[0].name).toBe('Bytes');
  expect(my.attributes[0].type.type).toBe('FixedArray');
  const arrayType = my.attributes[0].type as Definition.Types.FixedArray;
  expect(arrayType.element.type).toBe('Struct');
  const structType = arrayType.element as Definition.Types.Struct;
  expect(structType.name).toBe('Bluchs');
  expect(structType.attributes.length).toBe(1);
  expect(structType.attributes[0].type.bytes).toBe(1);
  expect(structType.attributes[0].type.type).toBe('Boolean');
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

test('simple fixed len string("utf-8")', () => {});

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
