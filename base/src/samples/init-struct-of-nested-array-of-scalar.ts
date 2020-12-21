import { Types } from '..';

export class InitStructOfNestedArrayOfScalar {
    public readonly Init = {
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
    public readonly Default = this.Init;
    public readonly Type = new Types.Struct.Definition({
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
        ...Types.SimpleScalarTypesList.map((I) => {
          let defType: Types.Base.Definition<unknown>;
          switch (I.type) {
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
              element: new I({ initial: { high: 47, low: 11 } as never }),
            });
            break;
          default:
            defType = new Types.FixedArray.Definition({
              length: 4,
              // uncool cast but
              element: new I({ initial: 147 } as { initial: never }),
            });
            break;
          }
          return { name: `NameArray${I.type}`, type: defType };
        }),
      ],
    });
}
