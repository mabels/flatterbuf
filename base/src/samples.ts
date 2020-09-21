import {Types} from './';

export function FixArrayOfScalarType(
    len: number,
    factory: () => Types.Base.Definition<unknown>,
): Types.FixedArray.Definition<unknown> {
  return new Types.FixedArray.Definition({
    element: factory(),
    length: len,
  });
}

export function FixArrayOfFixArrayScalarType(
    l1: number,
    l2: number,
): Types.FixedArray.Definition<unknown> {
  return new Types.FixedArray.Definition({
    element: new Types.FixedArray.Definition({
      element: new Types.Boolean.Definition(),
      length: l2,
    }),
    length: l1,
  });
}

export function NestedArrayOfStruct(): Types.FixedArray.Definition<unknown> {
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

interface NamedStruct extends Record<string, unknown> {
  NameBoolean: boolean;
  NameUint8: number;
  NameChar: number; // 'a'
  NameUint16: number;
  NameShort: number;
  NameUint32: number;
  NameInt: number;
  NameFloat: number;
  NameUint64: Types.HighLow.Type;
  NameLong: Types.HighLow.Type;
  NameDouble: number;
  NameString: Array<number>;
  NameBitStruct: {
    _1bit: boolean;
    _3bit: number;
    _8bit: number;
  };
}

class StructOfScalar {
  // tslint:disable-next-line: typedef
  public static readonly Default: NamedStruct = {
    NameBoolean: false,
    NameUint8: 0,
    NameChar: 0, // 'a'
    NameUint16: 0,
    NameShort: 0,
    NameUint32: 0,
    NameInt: 0,
    NameFloat: 0,
    NameUint64: {high: 0, low: 0},
    NameLong: {high: 0, low: 0},
    NameDouble: 0,
    NameString: Array<number>(10).fill(0),
    NameBitStruct: {
      _1bit: false,
      _3bit: 0,
      _8bit: 0,
    },
  };

  public static readonly Init: NamedStruct = {
    NameBoolean: true,
    NameUint8: 1,
    NameChar: 97, // 'a'
    NameUint16: 3,
    NameShort: 4,
    NameUint32: 5,
    NameInt: 6,
    NameFloat: 9.873900413513184,
    NameUint64: {high: 77, low: 88},
    NameLong: {high: 99, low: 1111},
    NameDouble: 10.7392,
    NameString: (() => {
      const nameString = Array<number>(10)
          .fill(0)
          .map((_, i) => i + 'a'.charCodeAt(0));
      nameString[nameString.length - 1] = 0;
      return nameString;
    })(),
    NameBitStruct: {
      _1bit: true,
      _3bit: 5,
      _8bit: 0x75,
    },
  };
  public static readonly Type: Types.Struct.Definition = StructOfScalar.Builder('StructOfScalar');

  public static Builder(name: string): Types.Struct.Definition {
    const m: Types.Struct.Attribute<unknown>[] = Types.SimpleScalarTypesList.map((I) => ({
      name: `Name${I.type}`,
      type: new I(),
    }));

    m.push({
      name: `NameString`,
      type: new Types.FixedCString.Definition({length: 10}),
    });
    m.push({
      name: `NameBitStruct`,
      type: new Types.BitStruct.Definition({
        length: 2,
        bits: [
          {name: '_1bit', start: 1},
          {name: '_3bit', start: 2, length: 3},
          {name: '_8bit', start: 4, length: 8},
        ],
      }),
    });
    return new Types.Struct.Definition({
      name,
      attributes: m,
    });
  }
}

class InitStructOfScalar {
  public static readonly Default: NamedStruct = StructOfScalar.Init;
  public static readonly Init: NamedStruct = StructOfScalar.Default;
  public static readonly Type: Types.Struct.Definition = InitStructOfScalar.Builder(
      'InitStructOfScalar',
  );
  public static Builder(name: string): Types.Struct.Definition {
    const m: Types.Struct.Attribute<unknown>[] = Types.SimpleScalarTypesList.map((I) => ({
      name: `Name${I.type}`,
      type: new I({initial: StructOfScalar.Init[`Name${I.type}`] as never}),
    }));
    m.push({
      name: `NameString`,
      type: new Types.FixedCString.Definition({length: 10, initial: 'abcdefghijk'}),
    });
    // debugger;
    m.push({
      name: `NameBitStruct`,
      type: new Types.BitStruct.Definition({
        name: `DefBitInit${name.replace(/struct/i, 'Xtruct')}`,
        length: 2,
        bits: [
          {name: '_1bit', start: 1, initial: true},
          {name: '_3bit', start: 2, length: 3, initial: 5},
          {name: '_8bit', start: 4, length: 8, initial: 0x75},
        ],
      }),
    });
    return new Types.Struct.Definition({
      name,
      attributes: m,
    });
  }
}

class ExternInitStructofScalar {
  public static readonly Default: NamedStruct = StructOfScalar.Init;
  public static readonly Init: NamedStruct = StructOfScalar.Default;
  public static readonly Type: Types.Struct.Definition = ExternInitStructofScalar.Builder(
      'ExternalStructOfScalar',
  );
  public static Builder(name: string): Types.Struct.Definition {
    const m: Types.Struct.Attribute<unknown>[] = Types.SimpleScalarTypesList.map((I) => ({
      name: `Name${I.type}`,
      type: new I(),
    }));
    m.push({
      name: `NameString`,
      type: new Types.FixedCString.Definition({length: 10}),
    });
    // debugger;
    m.push({
      name: `NameBitStruct`,
      type: new Types.BitStruct.Definition({
        name: `DefBitInit${name.replace(/struct/i, 'Xtruct')}`,
        length: 2,
        bits: [
          {name: '_1bit', start: 1},
          {name: '_3bit', start: 2, length: 3},
          {name: '_8bit', start: 4, length: 8},
        ],
      }),
    });
    return new Types.Struct.Definition({
      name,
      attributes: m,
      initial: ExternInitStructofScalar.Default,
    });
  }
}

class StructOfNestedStruct {
  public static readonly Type: Types.Struct.Definition = new Types.Struct.Definition({
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

  public static readonly Default: Record<string, unknown> = {
    Yu: 0,
    Max: {
      Zu: 0,
      Plax: {
        Uhu: 0,
      },
    },
  };
  public static readonly Init: Record<string, unknown> = {
    Yu: 4711,
    Max: {
      Zu: 4712,
      Plax: {
        Uhu: 97,
      },
    },
  };
}

class InitStructOfNestedStruct {
  public static readonly Default: Record<string, unknown> = StructOfNestedStruct.Init;
  public static readonly Init: Record<string, unknown> = StructOfNestedStruct.Default;
  public static readonly Type: Types.Struct.Definition = new Types.Struct.Definition({
    name: 'InitStructOfNestedStruct',
    attributes: [
      {
        name: 'Yu',
        type: new Types.Int.Definition({initial: 4711}),
      },
      {
        name: 'Max',
        type: new Types.Struct.Definition({
          name: 'InitBux',
          attributes: [
            {
              name: 'Zu',
              type: new Types.Int.Definition({initial: 4712}),
            },
            {
              name: 'Plax',
              type: new Types.Struct.Definition({
                name: 'InitWurx',
                attributes: [
                  {
                    name: 'Uhu',
                    type: new Types.Char.Definition({initial: 'a'}),
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

class StructOfNestedArrayOfScalar {
  public static readonly Type: Types.Struct.Definition = new Types.Struct.Definition({
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
          element: new Types.FixedCString.Definition({length: 10}),
        }),
      },
      ...Types.SimpleScalarTypesList.map((I) => ({
        name: `NameArray${I.type}`,
        type: new Types.FixedArray.Definition({
          length: 4,
          element: new I(),
        }),
      })),
    ],
  });
  public static readonly Default: Record<string, unknown> = {
    Nested: Array(2).fill(Array(3).fill(Array(4).fill(0))),
    FlatCstring: Array(10).fill(
        new Types.FixedCString.Definition({
          length: 10,
          initial: 'mutig',
        }),
    ),
    ...Types.SimpleScalarTypesList.reduce((r, i) => {
      switch (i.type) {
        case Types.Boolean.Definition.type:
          r[`NameArray${i.type}`] = Array(4).fill(false);
          break;
        case Types.Long.Definition.type:
        case Types.Uint64.Definition.type:
          r[`NameArray${i.type}`] = Array(4).fill({high: 0, low: 0});
          break;
        default:
          r[`NameArray${i.type}`] = Array(4).fill(0);
          break;
      }
      return r;
    }, {} as Record<string, unknown>),
    // FlatChar: Array(10).fill(0),
    // FlatCstring: Array(10).fill(Array(10).fill(0)),
  };
  private static readonly numberInit: number[] = [4, 3, 1, 9];
  public static readonly Init: Record<string, unknown> = {
    Nested: Array(2).fill(Array(3).fill(StructOfNestedArrayOfScalar.numberInit)),
    FlatCstring: Array(10).fill(
        new Types.FixedCString.Definition({
          length: 10,
          initial: 'Mutig',
        }),
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
              .map((_, j) => ({high: 13 + j * 3, low: 27 + j * 7}));
          break;
        default:
          r[`NameArray${i.type}`] = StructOfNestedArrayOfScalar.numberInit;
          break;
      }
      return r;
    }, {} as Record<string, unknown>),
  };
}

class InitStructOfNestedArrayOfScalar {
  public static readonly Init: Record<string, unknown> = {
    Nested: Array(2).fill(Array(3).fill(Array(4).fill(117))),
    FlatCstring: Array(10).fill(
        new Types.FixedCString.Definition({length: 10}).create('cstring'),
    ),
    ...Types.SimpleScalarTypesList.reduce((r, i) => {
      switch (i.type) {
        case Types.Boolean.Definition.type:
          r[`NameArray${i.type}`] = [true, true, true, true];
          break;
        case Types.Long.Definition.type:
        case Types.Uint64.Definition.type:
          r[`NameArray${i.type}`] = Array(4).fill({high: 47, low: 11});
          break;
        default:
          r[`NameArray${i.type}`] = [147, 147, 147, 147];
          break;
      }
      return r;
    }, {} as Record<string, unknown>),
  };
  public static readonly Default: Record<string, unknown> = InitStructOfNestedArrayOfScalar.Init;
  public static readonly Type: Types.Struct.Definition = new Types.Struct.Definition({
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
              element: new Types.Char.Definition({initial: 'u'}),
            }),
          }),
        }),
      },
      {
        name: `FlatCstring`,
        type: new Types.FixedArray.Definition({
          length: 10,
          element: new Types.FixedCString.Definition({length: 10, initial: 'cstring'}),
        }),
      },
      ...Types.SimpleScalarTypesList.map((I) => {
        let defType: Types.Base.Definition<unknown>;
        switch (I.type) {
          case Types.Boolean.Definition.type:
            defType = new Types.FixedArray.Definition({
              length: 4,
              element: new Types.Boolean.Definition({initial: true}),
            });
            break;
          case Types.Long.Definition.type:
          case Types.Uint64.Definition.type:
            defType = new Types.FixedArray.Definition({
              length: 4,
              // uncool cast but
              element: new I({initial: {high: 47, low: 11} as never}),
            });
            break;
          default:
            defType = new Types.FixedArray.Definition({
              length: 4,
              // uncool cast but
              element: new I({initial: 147} as { initial: never }),
            });
            break;
        }
        return {name: `NameArray${I.type}`, type: defType};
      }),
    ],
  });
}

class StructOfNestedArrayOfStruct {
  private static readonly element: Types.Struct.Definition = StructOfScalar.Builder('sonasNested');
  // const element = new Types.Struct({
  //   name: 'bla',
  //   attributes: [
  //     {
  //     name: 'jo',
  //     type: new Types.Char({initial: 'X'})
  //     }
  //   ]
  // });
  public static readonly Type: Types.Struct.Definition = new Types.Struct.Definition({
    name: 'StructOfNestedArrayOfStruct',
    attributes: [
      {
        name: `Nested`,
        type: new Types.FixedArray.Definition({
          length: 3,
          element: new Types.FixedArray.Definition({
            length: 4,
            element: StructOfNestedArrayOfStruct.element,
          }),
        }),
      },
      {
        name: `Flat`,
        type: new Types.FixedArray.Definition({
          length: 10,
          element: StructOfNestedArrayOfStruct.element,
        }),
      },
    ],
  });
  public static readonly Default: Record<string, unknown> = {
    Nested: Array(3).fill(Array(4).fill(StructOfScalar.Default)),
    Flat: Array(10).fill(StructOfScalar.Default),
  };
  public static readonly Init: Record<string, unknown> = {
    Nested: Array(3).fill(Array(4).fill(StructOfScalar.Init)),
    Flat: Array(10).fill(StructOfScalar.Init),
  };
}

class InitStructOfNestedArrayOfStruct {
  public static readonly Init: Record<string, unknown> = StructOfNestedArrayOfStruct.Default;
  public static readonly Default: Record<string, unknown> = StructOfNestedArrayOfStruct.Init;
  public static element: Types.Struct.Definition = InitStructOfScalar.Builder('isonasNested');
  public static readonly Type: Types.Struct.Definition = new Types.Struct.Definition({
    name: 'InitStructOfNestedArrayOfStruct',
    attributes: [
      {
        name: `Nested`,
        type: new Types.FixedArray.Definition({
          length: 3,
          element: new Types.FixedArray.Definition({
            length: 4,
            element: InitStructOfNestedArrayOfStruct.element,
          }),
        }),
      },
      {
        name: `Flat`,
        type: new Types.FixedArray.Definition({
          length: 10,
          element: InitStructOfNestedArrayOfStruct.element,
        }),
      },
    ],
  });
}

export const Samples = {
  StructOfScalar: StructOfScalar,

  InitStructOfScalar: InitStructOfScalar,

  ExternInitStructofScalar: ExternInitStructofScalar,

  StructOfNestedStruct: StructOfNestedStruct,

  InitStructOfNestedStruct: InitStructOfNestedStruct,

  StructOfNestedArrayOfScalar: StructOfNestedArrayOfScalar,

  InitStructOfNestedArrayOfScalar: InitStructOfNestedArrayOfScalar,

  StructOfNestedArrayOfStruct: StructOfNestedArrayOfStruct,

  InitStructOfNestedArrayOfStruct: InitStructOfNestedArrayOfStruct,

  Tests: [
    StructOfScalar,
    InitStructOfScalar,
    ExternInitStructofScalar,
    StructOfNestedStruct,
    InitStructOfNestedStruct,
    StructOfNestedArrayOfScalar,
    InitStructOfNestedArrayOfScalar,
    StructOfNestedArrayOfStruct,
    InitStructOfNestedArrayOfStruct,
  ],
};
