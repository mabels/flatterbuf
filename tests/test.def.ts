import { Types } from '../dist/definition';

const m: Types.Struct.Attribute<unknown>[] = Types.SimpleScalarTypesList.map((i) => ({
    name: `Name${i.type}`,
    type: new i()
  }));
  m.push({
    name: `NameString`,
    type: new Types.FixedCString.Definition({ length: 10, initial: 'abcdefghijk' }),
  });
  // debugger;
  m.push({
    name: `NameBitStruct`,
    type: new Types.BitStruct.Definition({
      name: `DefBitInitMurx`,
      length: 2,
      bits: [
        { name: '_1bit', start: 1, initial: true },
        { name: '_3bit', start: 2, length: 3, initial: 5 },
        { name: '_8bit', start: 4, length: 8, initial: 0x75 },
      ],
    }),
  });
export const Bla = new Types.Struct.Definition({
    name: 'BlaBlaTest',
    attributes: m,
  });

  export const Scared = {};
  export const ScaredScalar = 4;
  export const ScaredFn = function() {};

export const SearchMe = {
    deep: {
        Bla
    },
    hund: function() { }
}

export default Bla