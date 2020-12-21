import { Types } from '..';

export class StructOfNestedArrayOfScalar {
    public readonly Type = new Types.Struct.Definition({
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
        ...Types.SimpleScalarTypesList.map((I) => ({
          name: `NameArray${I.type}`,
          type: new Types.FixedArray.Definition({
            length: 4,
            element: new I() as any,
          }),
        })),
      ],
    });
    public readonly Default = {
      Nested: Array(2).fill(Array(3).fill(Array(4).fill(0))),
      FlatCstring: Array(10).fill((this.Type.attributeByName.FlatCstring.type as any).element.create()),
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
    private readonly numberInit = [4, 3, 1, 9];
    public readonly Init = {
      Nested: Array(2).fill(Array(3).fill(this.numberInit)),
      FlatCstring: Array(10).fill(
        (this.Type.attributeByName.FlatCstring.type as any).element.create('Mutig'),
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
          r[`NameArray${i.type}`] = this.numberInit;
          break;
        }
        return r;
      }, {} as Record<string, any>),
    };
}
