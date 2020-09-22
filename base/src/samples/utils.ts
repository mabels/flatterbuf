import {Types} from '..';

export type FactoryFN<T> = () => Types.Base.Definition<T>;

export function FixArrayOfScalarType<T = unknown>(
    len: number,
    cb: FactoryFN<T>): Types.FixedArray.Definition<T> {
  return new Types.FixedArray.Definition({
    element: cb(),
    length: len,
  });
}

export function FixArrayOfFixArrayScalarType(l1: number, l2: number):
    Types.FixedArray.Definition<unknown> {
  return new Types.FixedArray.Definition({
    element: new Types.FixedArray.Definition({
      element: new Types.Boolean.Definition(),
      length: l2,
    }),
    length: l1,
  });
}

export function NestedArrayOfStruct() {
  return new Types.FixedArray.Definition({
    length: 4,
    element: new Types.Struct.Definition({
      name: 'Bluchs',
      attributes: [
        {
          name: 'Murks',
          type: new Types.Boolean.Definition(),
        },
      ],
    }),
  });
}
