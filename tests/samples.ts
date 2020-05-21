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
    export function Builder(name: string) {
      const m: Definition.Types.StructAttribute<unknown>[] = Definition.Types.SimpleScalarTypesList.map(
        i => ({
          name: `Name${i.type}`,
          type: new i(),
        }),
      );
      m.push({
        name: `NameString`,
        type: new Definition.Types.FixedCString({ length: 10 }),
      });
      m.push({
        name: `NameBitStruct`,
        type: new Definition.Types.BitStruct({
          length: 2,
          bits: [
            { name: '_1bit', start: 1 },
            { name: '_3bit', start: 2, length: 3 },
            { name: '_8bit', start: 4, length: 8 },
          ],
        }),
      });
      return new Definition.Types.Struct({
        name,
        attributes: m,
      });
    }
    export const Default = {
      NameBoolean: false,
      NameUint8: 0,
      NameChar: 0, // 'a'
      NameUint16: 0,
      NameShort: 0,
      NameUint32: 0,
      NameInt: 0,
      NameFloat: 0,
      NameUint64: { high: 0, low: 0 },
      NameLong: { high: 0, low: 0 },
      NameDouble: 0,
      NameString: Array<number>(10).fill(0),
      NameBitStruct: {
        _1bit: false,
        _3bit: 0,
        _8bit: 0,
      },
    };
    export const Type = Builder('StructOfScalar');

    const nameString = Array<number>(10)
      .fill(0)
      .map((_, i) => i + 'a'.charCodeAt(0));
    nameString[nameString.length - 1] = 0;
    export const Init = {
      NameBoolean: true,
      NameUint8: 1,
      NameChar: 97, // 'a'
      NameUint16: 3,
      NameShort: 4,
      NameUint32: 5,
      NameInt: 6,
      NameFloat: 9.873900413513184,
      NameUint64: { high: 77, low: 88 },
      NameLong: { high: 99, low: 1111 },
      NameDouble: 10.7392,
      NameString: nameString,
      NameBitStruct: {
        _1bit: true,
        _3bit: 5,
        _8bit: 0x75,
      },
    };
  }

  export namespace InitStructOfScalar {
    export const Default = StructOfScalar.Init;
    export const Init = StructOfScalar.Default;
    export function Builder(name: string) {
      const m: Definition.Types.StructAttribute<unknown>[] = Definition.Types.SimpleScalarTypesList.map(
        i => ({
          name: `Name${i.type}`,
          type: new i({ initial: (StructOfScalar.Init as any)[`Name${i.type}`] as any }),
        }),
      );
      m.push({
        name: `NameString`,
        type: new Definition.Types.FixedCString({ length: 10, initial: 'abcdefghijk' }),
      });
      // debugger;
      m.push({
        name: `NameBitStruct`,
        type: new Definition.Types.BitStruct({
          name: `DefBitInit${name.replace(/struct/i, 'Xtruct')}`,
          length: 2,
          bits: [
            { name: '_1bit', start: 1, initial: true },
            { name: '_3bit', start: 2, length: 3, initial: 5 },
            { name: '_8bit', start: 4, length: 8, initial: 0x75 },
          ],
        }),
      });
      return new Definition.Types.Struct({
        name,
        attributes: m,
      });
    }
    export const Type = Builder('InitStructOfScalar');
  }

  export namespace ExternInitStructofScalar {
    export const Default = StructOfScalar.Init;
    export const Init = StructOfScalar.Default;
    export function Builder(name: string) {
      const m: Definition.Types.StructAttribute<unknown>[] = Definition.Types.SimpleScalarTypesList.map(
        i => ({
          name: `Name${i.type}`,
          type: new i(),
        }),
      );
      m.push({
        name: `NameString`,
        type: new Definition.Types.FixedCString({ length: 10 }),
      });
      // debugger;
      m.push({
        name: `NameBitStruct`,
        type: new Definition.Types.BitStruct({
          name: `DefBitInit${name.replace(/struct/i, 'Xtruct')}`,
          length: 2,
          bits: [
            { name: '_1bit', start: 1 },
            { name: '_3bit', start: 2, length: 3},
            { name: '_8bit', start: 4, length: 8},
          ],
        }),
      });
      return new Definition.Types.Struct({
        name,
        attributes: m,
        initial: Default
      });
    }
    export const Type = Builder('ExternalStructOfScalar');
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

    export const Default = {
      Yu: 0,
      Max: {
        Zu: 0,
        Plax: {
          Uhu: 0,
        },
      },
    };
    export const Init = {
      Yu: 4711,
      Max: {
        Zu: 4712,
        Plax: {
          Uhu: 97,
        },
      },
    };
  }
  export namespace InitStructOfNestedStruct {
    export const Default = StructOfNestedStruct.Init;
    export const Init = StructOfNestedStruct.Default;
    export const Type = new Definition.Types.Struct({
      name: 'InitStructOfNestedStruct',
      attributes: [
        {
          name: 'Yu',
          type: new Definition.Types.Int({ initial: 4711 }),
        },
        {
          name: 'Max',
          type: new Definition.Types.Struct({
            name: 'InitBux',
            attributes: [
              {
                name: 'Zu',
                type: new Definition.Types.Int({ initial: 4712 }),
              },
              {
                name: 'Plax',
                type: new Definition.Types.Struct({
                  name: 'InitWurx',
                  attributes: [
                    {
                      name: 'Uhu',
                      type: new Definition.Types.Char({ initial: 'a' }),
                    },
                  ],
                }),
              },
            ],
          }),
        },
      ],
    });
  }

  export namespace StructOfNestedArrayOfScalar {
    export const Type = new Definition.Types.Struct({
      name: 'StructOfNestedArrayOfScalar',
      attributes: [
        {
          name: `Nested`,
          type: new Definition.Types.FixedArray({
            length: 2,
            element: new Definition.Types.FixedArray({
              length: 3,
              element: new Definition.Types.FixedArray({
                length: 4,
                element: new Definition.Types.Char(),
              }),
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
    export const Default = {
      Nested: Array(2).fill(Array(3).fill(Array(4).fill(0))),
      Flat: Array(10).fill(0),
    };
    export const Init = {
      Nested: Array(2).fill(Array(3).fill(Array(4).fill(117))),
      Flat: Array(10).fill(115),
    };
  }
  export namespace InitStructOfNestedArrayOfScalar {
    export const Default = StructOfNestedArrayOfScalar.Init;
    export const Init = StructOfNestedArrayOfScalar.Default;
    export const Type = new Definition.Types.Struct({
      name: 'InitStructOfNestedArrayOfScalar',
      attributes: [
        {
          name: `Nested`,
          type: new Definition.Types.FixedArray({
            length: 2,
            element: new Definition.Types.FixedArray({
              length: 3,
              element: new Definition.Types.FixedArray({
                length: 4,
                element: new Definition.Types.Char({ initial: 'u' }),
              }),
            }),
          }),
        },
        {
          name: `Flat`,
          type: new Definition.Types.FixedArray({
            length: 10,
            element: new Definition.Types.Char({ initial: 's' }),
          }),
        },
      ],
    });
  }

  export namespace StructOfNestedArrayOfStruct {
    const element = StructOfScalar.Builder('sonasNested');
    // const element = new Definition.Types.Struct({
    //   name: 'bla',
    //   attributes: [
    //     {
    //     name: 'jo',
    //     type: new Definition.Types.Char({initial: 'X'})
    //     }
    //   ]
    // });
    export const Type = new Definition.Types.Struct({
      name: 'StructOfNestedArrayOfStruct',
      attributes: [
        {
          name: `Nested`,
          type: new Definition.Types.FixedArray({
            length: 3,
            element: new Definition.Types.FixedArray({
              length: 4,
              element,
            }),
          }),
        },
        {
          name: `Flat`,
          type: new Definition.Types.FixedArray({
            length: 10,
            element,
          }),
        },
      ],
    });
    export const Default = {
      Nested: Array(3).fill(Array(4).fill(StructOfScalar.Default)),
      Flat: Array(10).fill(StructOfScalar.Default),
    };
    export const Init = {
      Nested: Array(3).fill(Array(4).fill(StructOfScalar.Init)),
      Flat: Array(10).fill(StructOfScalar.Init),
    };
  }
  export namespace InitStructOfNestedArrayOfStruct {
    export const Init = StructOfNestedArrayOfStruct.Default;
    export const Default = StructOfNestedArrayOfStruct.Init;
    const element = InitStructOfScalar.Builder('isonasNested');
    export const Type = new Definition.Types.Struct({
      name: 'InitStructOfNestedArrayOfStruct',
      attributes: [
        {
          name: `Nested`,
          type: new Definition.Types.FixedArray({
            length: 3,
            element: new Definition.Types.FixedArray({
              length: 4,
              element,
            }),
          }),
        },
        {
          name: `Flat`,
          type: new Definition.Types.FixedArray({
            length: 10,
            element,
          }),
        },
      ],
    });
  }
  export const Tests = [
    StructOfScalar,
    InitStructOfScalar,
    ExternInitStructofScalar,
    // StructOfNestedStruct,
    // InitStructOfNestedStruct,
    // StructOfNestedArrayOfScalar,
    // InitStructOfNestedArrayOfScalar,
    // StructOfNestedArrayOfStruct,
    // InitStructOfNestedArrayOfStruct,
  ];
}
