import { Types } from '..';
import { StructOfNestedStruct } from './struct-of-nested-struct';

export class InitStructOfNestedStruct {
  constructor(public readonly StructOfNestedStruct: StructOfNestedStruct) {
  }
    public readonly Default = this.StructOfNestedStruct.Init;
    public readonly Init = this.StructOfNestedStruct.Default;
    public readonly Type = new Types.Struct.Definition({
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
