import { Definition } from '../src/definition';

export function FixArrayOfScalarType<T>(len: number, element: any) {
  return new Definition.Types.FixedArray({
    element: new element(),
    length: len,
  });
}

export function FixArrayOfFixArrayScalarType(l1: number, l2: number) {
  return new Definition.Types.FixedArray({
    element: new Definition.Types.FixedArray({
      element: new Definition.Types.Boolean(),
      length: l2,
    }),
    length: l1,
  });
}

export function NestedArrayOfStruct() {
  return new Definition.Types.FixedArray({
    length: 4,
    element: new Definition.Types.Struct({
      name: 'Bluchs',
      attributes: [
        {
          name: 'Murks',
          type: new Definition.Types.Boolean(),
        },
      ],
    }),
  });
}

export namespace Samples {
  export namespace StructOfScalar {
    export const Type = new Definition.Types.Struct({
      name: 'StructOfScalar',
      attributes: Definition.Types.ScalarTypesList.map(i => ({
        name: `Name${i.type}`,
        type: new i(),
      })),
    });
    export const Init = {
      NameBoolean: true,
      NameUint8: 1,
      NameChar: 'a',
      NameUint16: 3,
      NameShort: 4,
      NameUint32: 5,
      NameInt: 6,
      NameFloat: 9.873900413513184,
      NameUint64: { high: 77, low: 88 },
      NameLong: { high: 99, low: 1111 },
      NameDouble: 10.7392,
    };
  }

  export namespace StructOfNestedStruct {
    export const Type = new Definition.Types.Struct({
      name: 'StructOfNestedStruct',
      attributes: [
        {
          name: 'Yu',
          type: new Definition.Types.Int(),
        },
        {
          name: 'Max',
          type: new Definition.Types.Struct({
            name: 'Bux',
            attributes: [
              {
                name: 'Zu',
                type: new Definition.Types.Int(),
              },
              {
                name: 'Plax',
                type: new Definition.Types.Struct({
                  name: 'Wurx',
                  attributes: [
                    {
                      name: 'Uhu',
                      type: new Definition.Types.Char(),
                    },
                  ],
                }),
              },
            ],
          }),
        },
      ],
    });

    export const Init = {
      Yu: 4711,
      Max: {
        Zu: 4712,
        Plax: {
          Uhu: 'a',
        }
      }
    };
  }

  export namespace StructOfNestedArrayOfScalar {
    export const Type = new Definition.Types.Struct({
      name: 'StructOfNestedArrayOfScalar',
      attributes: [
        {
          name: `Nested`,
          type: new Definition.Types.FixedArray({
            length: 3,
            element: new Definition.Types.FixedArray({
              length: 4,
              element: new Definition.Types.Char(),
            }),
          }),
        },
        {
          name: `Flat`,
          type: new Definition.Types.FixedArray({
            length: 10,
            element: new Definition.Types.Char(),
          }),
        },
      ],
    });
    export const Init = {
      Nested: Array(3).fill(Array(4).fill('u')),
      Flat: Array(10).fill('s'),
    };
  }

  export namespace StructOfNestedArrayOfStruct {
    export const Type = new Definition.Types.Struct({
      name: 'StructOfNestedArrayOfStruct',
      attributes: [
        {
          name: `Nested`,
          type: new Definition.Types.FixedArray({
            length: 3,
            element: new Definition.Types.FixedArray({
              length: 4,
              element: StructOfScalar.Type,
            }),
          }),
        },
        {
          name: `Flat`,
          type: new Definition.Types.FixedArray({
            length: 10,
            element: StructOfScalar.Type,
          }),
        },
      ],
    });
    export const Init = {
      Nested: Array(3).fill(Array(4).fill(StructOfScalar.Init)),
      Flat: Array(10).fill(StructOfScalar.Init),
    };
  }
  export const Tests = [
    StructOfScalar,
    StructOfNestedStruct,
    StructOfNestedArrayOfScalar,
    StructOfNestedArrayOfStruct,
  ];
}
