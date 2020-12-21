import { Types } from '..';
import { InitStructOfScalar } from './init-struct-of-scalar';
import { StructOfNestedArrayOfStruct } from './struct-of-nested-array-of-struct';

export class InitStructOfNestedArrayOfStruct {
  constructor(
        public readonly StructOfNestedArrayOfStruct: StructOfNestedArrayOfStruct,
        public readonly InitStructOfScalar: InitStructOfScalar) {}

    public readonly Init = this.StructOfNestedArrayOfStruct.Default;
    public readonly Default = this.StructOfNestedArrayOfStruct.Init;
    private readonly element = this.InitStructOfScalar.Builder('isonasNested');
    public readonly Type = new Types.Struct.Definition({
      name: 'InitStructOfNestedArrayOfStruct',
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
}
