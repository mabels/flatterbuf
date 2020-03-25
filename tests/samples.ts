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

export function StructOfScalar() {
  return new Definition.Types.Struct({
    name: 'StructOfScalar',
    attributes: Definition.Types.ScalarTypesList.map(i => ({
      name: `Name${i.type}`,
      type: new i(),
    })),
  });
}

export function StructOfNestedStruct() {
  return new Definition.Types.Struct({
    name: 'StructOfNestedStruct',
    attributes: [
    {
      name: 'Yu',
      type: new Definition.Types.Int({ initial: 4711 })
    },
    {
      name: 'Max',
      type: new Definition.Types.Struct({
        name: 'Bux',
        attributes: [
          {
            name: 'Zu',
            type: new Definition.Types.Int({ initial: 4712 })
          },
        {
          name: 'Plax',
          type: new Definition.Types.Struct({
            name: 'Wurx',
            attributes: [
              {
              name: 'Uhu',
              type: new Definition.Types.Char({ initial: 'a'}),
              }
            ]
        })},
      ]}),
    },
  ]});
}

export function StructOfNestedArrayOfScalar() {
  return new Definition.Types.Struct({
    name: 'StructOfNestedArrayOfScalar',
    attributes: [
    {
      name: `Bytes`,
      type: new Definition.Types.FixedArray({
        length: 6,
        element: new Definition.Types.Boolean(),
      }),
    },
  ]});
}

export function StructOfNestedArrayOfStruct() {
  return new Definition.Types.Struct({
    name: 'StructOfNestedArrayOfStruct',
    attributes: [
    {
      name: `Bytes`,
      type: new Definition.Types.FixedArray({
        length: 6,
        element: new Definition.Types.Struct({
          name: 'Bluchs',
          attributes: [
          {
            name: 'Murks',
            type: new Definition.Types.Boolean(),
          },
        ]}),
      }),
    },
  ]});
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
    ]}),
  });
}
