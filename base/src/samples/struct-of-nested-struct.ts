import { Types } from '..';

export class StructOfNestedStruct {
    public readonly Type = new Types.Struct.Definition({
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

    public readonly Default = {
      Yu: 0,
      Max: {
        Zu: 0,
        Plax: {
          Uhu: 0,
        },
      },
    };
    public readonly Init = {
      Yu: 4711,
      Max: {
        Zu: 4712,
        Plax: {
          Uhu: 97,
        },
      },
    };
}
