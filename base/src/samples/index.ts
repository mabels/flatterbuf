import {ExternInitStructofScalar as MyExternInitStructofScalar} from './extern-init-structof-scalar';
import {
  InitStructOfNestedArrayOfScalar as MyInitStructOfNestedArrayOfScalar,
} from './init-struct-of-nested-array-of-scalar';
import {
  InitStructOfNestedArrayOfStruct as MyInitStructOfNestedArrayOfStruct,
} from './init-struct-of-nested-array-of-struct';
import {InitStructOfNestedStruct as MyInitStructOfNestedStruct} from './init-struct-of-nested-struct';
import {InitStructOfScalar as MyInitStructOfScalar} from './init-struct-of-scalar';
import {StructOfNestedArrayOfScalar as MyStructOfNestedArrayOfScalar} from './struct-of-nested-array-of-scalar';
import {StructOfNestedArrayOfStruct as MyStructOfNestedArrayOfStruct} from './struct-of-nested-array-of-struct';
import {StructOfNestedStruct as MyStructOfNestedStruct} from './struct-of-nested-struct';
import {StructOfScalar as MyStructOfScalar} from './struct-of-scalar';

export * as Utils from './utils';

export const StructOfScalar = new MyStructOfScalar();
export const InitStructOfScalar = new MyInitStructOfScalar(StructOfScalar);
export const ExternInitStructofScalar = new MyExternInitStructofScalar(StructOfScalar);

export const StructOfNestedStruct = new MyStructOfNestedStruct();
export const InitStructOfNestedStruct = new MyInitStructOfNestedStruct(StructOfNestedStruct);
export const StructOfNestedArrayOfScalar = new MyStructOfNestedArrayOfScalar();
export const StructOfNestedArrayOfStruct = new MyStructOfNestedArrayOfStruct(StructOfScalar);
export const InitStructOfNestedArrayOfScalar = new MyInitStructOfNestedArrayOfScalar();
export const InitStructOfNestedArrayOfStruct = new MyInitStructOfNestedArrayOfStruct(
    StructOfNestedArrayOfStruct, InitStructOfScalar);

export const Tests = [
  StructOfScalar,
  InitStructOfScalar,
  ExternInitStructofScalar,
  StructOfNestedStruct,
  InitStructOfNestedStruct,
  StructOfNestedArrayOfScalar,
  InitStructOfNestedArrayOfScalar,
  StructOfNestedArrayOfStruct,
  InitStructOfNestedArrayOfStruct,
];
