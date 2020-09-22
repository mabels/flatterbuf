import {TypeTester} from './type-tester';
import {StructOfScalar} from './struct-of-scalar';
import {Types} from '..';

export class ExternInitStructofScalar implements TypeTester {
  constructor(public readonly StructOfScalar: StructOfScalar) {
  }
    public readonly Default = this.StructOfScalar.Init;
    public readonly Init = this.StructOfScalar.Default;
    public Builder(name: string) {
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
        initial: this.Default,
      });
    }
    public readonly Type = this.Builder('ExternalStructOfScalar');
}
