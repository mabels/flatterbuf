import { Types } from '../src';

export function FixArrayOfScalarType<T>(len: number, element: any) {
  return new Types.FixedArray.Definition({
    element: new element(),
    length: len,
  });
}

export function FixArrayOfFixArrayScalarType(l1: number, l2: number) {
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

export namespace Samples {
  export namespace StructOfScalar {
    export function Builder(name: string) {
      const m: Types.Struct.Attribute<unknown>[] = Types.SimpleScalarTypesList.map((i) => ({
        name: `Name${i.type}`,
        type: new i(),
      }));

      m.push({
        name: `NameString`,
        type: new Types.FixedCString.Definition({ length: 10 }),
      });
      m.push({
        name: `NameBitStruct`,
        type: new Types.BitStruct.Definition({
          length: 2,
          bits: [
            { name: '_1bit', start: 1 },
            { name: '_3bit', start: 2, length: 3 },
            { name: '_8bit', start: 4, length: 8 },
          ],
        }),
      });
      return new Types.Struct.Definition({
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
      const m: Types.Struct.Attribute<unknown>[] = Types.SimpleScalarTypesList.map((i) => ({
        name: `Name${i.type}`,
        type: new i({ initial: (StructOfScalar.Init as any)[`Name${i.type}`] as any }),
      }));
      m.push({
        name: `NameString`,
        type: new Types.FixedCString.Definition({ length: 10, initial: 'abcdefghijk' }),
      });
      // debugger;
      m.push({
        name: `NameBitStruct`,
        type: new Types.BitStruct.Definition({
          name: `DefBitInit${name.replace(/struct/i, 'Xtruct')}`,
          length: 2,
          bits: [
            { name: '_1bit', start: 1, initial: true },
            { name: '_3bit', start: 2, length: 3, initial: 5 },
            { name: '_8bit', start: 4, length: 8, initial: 0x75 },
          ],
        }),
      });
      return new Types.Struct.Definition({
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
      const m: Types.Struct.Attribute<unknown>[] = Types.SimpleScalarTypesList.map((i) => ({
        name: `Name${i.type}`,
        type: new i(),
      }));
      m.push({
        name: `NameString`,
        type: new Types.FixedCString.Definition({ length: 10 }),
      });
      // debugger;
      m.push({
        name: `NameBitStruct`,
        type: new Types.BitStruct.Definition({
          name: `DefBitInit${name.replace(/struct/i, 'Xtruct')}`,
          length: 2,
          bits: [
            { name: '_1bit', start: 1 },
            { name: '_3bit', start: 2, length: 3 },
            { name: '_8bit', start: 4, length: 8 },
          ],
        }),
      });
      return new Types.Struct.Definition({
        name,
        attributes: m,
        initial: Default,
      });
    }
    export const Type = Builder('ExternalStructOfScalar');
  }

  export namespace StructOfNestedStruct {
    export const Type = new Types.Struct.Definition({
      name: 'StructOfNestedStruct',
      attributes: [
        {
          name: 'Yu',
          type: new Types.Int.Definition(),
        },
        {
          name: 'Max',
          type: new Types.Struct.Definition({
            name: 'Bux',
            attributes: [
              {
                name: 'Zu',
                type: new Types.Int.Definition(),
              },
              {
                name: 'Plax',
                type: new Types.Struct.Definition({
                  name: 'Wurx',
                  attributes: [
                    {
                      name: 'Uhu',
                      type: new Types.Char.Definition(),
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
    export const Type = new Types.Struct.Definition({
      name: 'InitStructOfNestedStruct',
      attributes: [
        {
          name: 'Yu',
          type: new Types.Int.Definition({ initial: 4711 }),
        },
        {
          name: 'Max',
          type: new Types.Struct.Definition({
            name: 'InitBux',
            attributes: [
              {
                name: 'Zu',
                type: new Types.Int.Definition({ initial: 4712 }),
              },
              {
                name: 'Plax',
                type: new Types.Struct.Definition({
                  name: 'InitWurx',
                  attributes: [
                    {
                      name: 'Uhu',
                      type: new Types.Char.Definition({ initial: 'a' }),
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
    export const Type = new Types.Struct.Definition({
      name: 'StructOfNestedArrayOfScalar',
      attributes: [
        {
          name: `Nested`,
          type: new Types.FixedArray.Definition({
            length: 2,
            element: new Types.FixedArray.Definition({
              length: 3,
              element: new Types.FixedArray.Definition({
                length: 4,
                element: new Types.Char.Definition(),
              }),
            }),
          }),
        },
        {
          name: `FlatCstring`,
          type: new Types.FixedArray.Definition({
            length: 10,
            element: new Types.FixedCString.Definition({ length: 10 }),
          }),
        },
        ...Types.SimpleScalarTypesList.map((i) => ({
          name: `NameArray${i.type}`,
          type: new Types.FixedArray.Definition({
            length: 4,
            element: new i() as any,
          }),
        })),
      ],
    });
    export const Default = {
      Nested: Array(2).fill(Array(3).fill(Array(4).fill(0))),
      FlatCstring: Array(10).fill((Type.attributeByName.FlatCstring.type as any).element.create()),
      ...Types.SimpleScalarTypesList.reduce((r, i) => {
        switch (i.type) {
          case Types.Boolean.Definition.type:
            r[`NameArray${i.type}`] = Array(4).fill(false);
            break;
          case Types.Long.Definition.type:
          case Types.Uint64.Definition.type:
            r[`NameArray${i.type}`] = Array(4).fill({ high: 0, low: 0 });
            break;
          default:
            r[`NameArray${i.type}`] = Array(4).fill(0);
            break;
        }
        return r;
      }, {} as Record<string, any>),
      // FlatChar: Array(10).fill(0),
      // FlatCstring: Array(10).fill(Array(10).fill(0)),
    };
    const numberInit = [4, 3, 1, 9];
    export const Init = {
      Nested: Array(2).fill(Array(3).fill(numberInit)),
      FlatCstring: Array(10).fill(
        (Type.attributeByName.FlatCstring.type as any).element.create('Mutig'),
      ),
      ...Types.SimpleScalarTypesList.reduce((r, i) => {
        switch (i.type) {
          case Types.Boolean.Definition.type:
            r[`NameArray${i.type}`] = [true, false, false, true];
            break;
          case Types.Long.Definition.type:
          case Types.Uint64.Definition.type:
            r[`NameArray${i.type}`] = Array(4)
              .fill(undefined)
              .map((_, j) => ({ high: 13 + j * 3, low: 27 + j * 7 }));
            break;
          default:
            r[`NameArray${i.type}`] = numberInit;
            break;
        }
        return r;
      }, {} as Record<string, any>),
    };
  }
  export namespace InitStructOfNestedArrayOfScalar {
    export const Init = {
      Nested: Array(2).fill(Array(3).fill(Array(4).fill(117))),
      FlatCstring: Array(10).fill(
        new Types.FixedCString.Definition({ length: 10 }).create('cstring'),
      ),
      ...Types.SimpleScalarTypesList.reduce((r, i) => {
        switch (i.type) {
          case Types.Boolean.Definition.type:
            r[`NameArray${i.type}`] = [true, true, true, true];
            break;
          case Types.Long.Definition.type:
          case Types.Uint64.Definition.type:
            r[`NameArray${i.type}`] = Array(4).fill({ high: 47, low: 11 });
            break;
          default:
            r[`NameArray${i.type}`] = [147, 147, 147, 147];
            break;
        }
        return r;
      }, {} as Record<string, any>),
    };
    export const Default = InitStructOfNestedArrayOfScalar.Init;
    export const Type = new Types.Struct.Definition({
      name: 'InitStructOfNestedArrayOfScalar',
      attributes: [
        {
          name: `Nested`,
          type: new Types.FixedArray.Definition({
            length: 2,
            element: new Types.FixedArray.Definition({
              length: 3,
              element: new Types.FixedArray.Definition({
                length: 4,
                element: new Types.Char.Definition({ initial: 'u' }),
              }),
            }),
          }),
        },
        {
          name: `FlatCstring`,
          type: new Types.FixedArray.Definition({
            length: 10,
            element: new Types.FixedCString.Definition({ length: 10, initial: 'cstring' }),
          }),
        },
        ...Types.SimpleScalarTypesList.map((i) => {
          let defType: Types.Base.Definition<unknown>;
          switch (i.type) {
            case Types.Boolean.Definition.type:
              defType = new Types.FixedArray.Definition({
                length: 4,
                element: new Types.Boolean.Definition({ initial: true }),
              });
              break;
            case Types.Long.Definition.type:
            case Types.Uint64.Definition.type:
              defType = new Types.FixedArray.Definition({
                length: 4,
                // uncool cast but
                element: new i({ initial: { high: 47, low: 11 } as never }),
              });
              break;
            default:
              defType = new Types.FixedArray.Definition({
                length: 4,
                // uncool cast but
                element: new i({ initial: 147 } as { initial: never }),
              });
              break;
          }
          return { name: `NameArray${i.type}`, type: defType };
        }),
      ],
    });
  }

  export namespace StructOfNestedArrayOfStruct {
    const element = StructOfScalar.Builder('sonasNested');
    // const element = new Types.Struct({
    //   name: 'bla',
    //   attributes: [
    //     {
    //     name: 'jo',
    //     type: new Types.Char({initial: 'X'})
    //     }
    //   ]
    // });
    export const Type = new Types.Struct.Definition({
      name: 'StructOfNestedArrayOfStruct',
      attributes: [
        {
          name: `Nested`,
          type: new Types.FixedArray.Definition({
            length: 3,
            element: new Types.FixedArray.Definition({
              length: 4,
              element,
            }),
          }),
        },
        {
          name: `Flat`,
          type: new Types.FixedArray.Definition({
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
    export const Type = new Types.Struct.Definition({
      name: 'InitStructOfNestedArrayOfStruct',
      attributes: [
        {
          name: `Nested`,
          type: new Types.FixedArray.Definition({
            length: 3,
            element: new Types.FixedArray.Definition({
              length: 4,
              element,
            }),
          }),
        },
        {
          name: `Flat`,
          type: new Types.FixedArray.Definition({
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
    StructOfNestedStruct,
    InitStructOfNestedStruct,
    StructOfNestedArrayOfScalar,
    InitStructOfNestedArrayOfScalar,
    StructOfNestedArrayOfStruct,
    InitStructOfNestedArrayOfStruct,
  ];
}
