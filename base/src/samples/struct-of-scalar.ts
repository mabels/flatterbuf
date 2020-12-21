import { Types } from '..';
import { TypeTester } from './type-tester';

export class StructOfScalar implements TypeTester {
  public Builder(name: string) {
    const m: Types.Struct.Attribute<unknown>[] = Types.SimpleScalarTypesList.map((I) => ({
      name: `Name${I.type}`,
      type: new I(),
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
    public readonly Default = {
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

    public readonly Type = this.Builder('StructOfScalar');
    public readonly Init = {
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
    }
}
