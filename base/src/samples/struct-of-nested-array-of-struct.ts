import { Types } from '..';
import { StructOfScalar } from './struct-of-scalar';

export class StructOfNestedArrayOfStruct {
  constructor(public readonly StructOfScalar: StructOfScalar) {
  }

    private readonly element = this.StructOfScalar.Builder('sonasNested');
    public readonly Type = new Types.Struct.Definition({
      name: 'StructOfNestedArrayOfStruct',
      attributes: [
        {
          name: `Nested`,
          type: new Types.FixedArray.Definition({
            length: 3,
            element: new Types.FixedArray.Definition({
              length: 4,
              element: this.element,
            }),
          }),
        },
        {
          name: `Flat`,
          type: new Types.FixedArray.Definition({
            length: 10,
            element: this.element,
          }),
        },
      ],
    });
    public readonly Default = {
      Nested: Array(3).fill(Array(4).fill(this.StructOfScalar.Default)),
      Flat: Array(10).fill(this.StructOfScalar.Default),
    };
    public readonly Init = {
      Nested: Array(3).fill(Array(4).fill(this.StructOfScalar.Init)),
      Flat: Array(10).fill(this.StructOfScalar.Init),
    };
}
