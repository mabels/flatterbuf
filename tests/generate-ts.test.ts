import { TSGenerator, TSWriter, TSStructWriter } from '../src/generator/ts';
import { Definition } from '../src/definition';
import { Runtime } from '../src/runtime';
import { StructOfScalar, StructOfNestedStruct } from './samples';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as ts from 'typescript';

// Definition.Types.ScalarTypesList.forEach(scalar => {
//   test('TS Generate Scalar', () => {

//   });
// })
const TmpId = `${crypto
  .createHash('sha256')
  .update(Math.random().toString())
  .digest('hex')}.tmp`;
const ProjectRelativ = `./tests/${TmpId}`;
// console.log(`WTF=>`, projectRelativ);
fs.mkdirSync(ProjectRelativ);

const Files: string[] = [];

function transpile(inTss: TSStructWriter[]) {
  const ret = inTss.forEach(inTs => {
    // console.log(`transpile =>`, inTss.length, inTs.fname);
    const js = ts.transpileModule(inTs.toString(), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
      },
    });
    fs.writeFileSync(`${ProjectRelativ}/${inTs.fname}.js`, js.outputText);
    Files.push(`${ProjectRelativ}/${inTs.fname}.js`);
    fs.writeFileSync(`${ProjectRelativ}/${inTs.fname}.ts`, inTs.toString());
    Files.push(`${ProjectRelativ}/${inTs.fname}.ts`);
  });
  return require(`./${TmpId}/${inTss[0].fname}`);
}

let HansWurstStructOfScalar: any;
const initHansWurstStructOfScalar = {
  NameBoolean: true,
  NameUint8: 1,
  NameChar: 'a',
  NameUint16: 3,
  NameShort: 4,
  NameUint32: 5,
  NameInt: 6,
  NameFloat: 9.9,
  NameUint64: { high: 77, low: 88 },
  NameLong: { high: 99, low: 1111 },
  NameDouble: 10.1,
};

let HansWurstStructOfNestedStruct: any;
const initHansWurstStructOfNestedStruct =
{ Max: { Plax: { Uhu: false } } }

beforeAll(() => {
  {
    const my = TSGenerator(
      StructOfScalar(),
      new TSWriter({
        runtimePath: '../../src/runtime',
        definitionPath: '../../src/definition',
      }),
    );
    HansWurstStructOfScalar = transpile(my.getStructs()).StructOfScalar;
  }
  {
    const my = TSGenerator(
      StructOfNestedStruct(),
      new TSWriter({
        runtimePath: '../../src/runtime',
        definitionPath: '../../src/definition',
      }),
    );
    const structs = my.getStructs();
    HansWurstStructOfNestedStruct = transpile(structs).StructOfNestedStruct;
  }
});

afterAll(() => {
  Files.forEach(fname => fs.unlinkSync(fname));
  fs.rmdirSync(ProjectRelativ);
});

test('test default in create', async () => {
  // create
  const val = HansWurstStructOfScalar.create();
  const init = {
    NameBoolean: false,
    NameUint8: 0,
    NameChar: ' ',
    NameUint16: 0,
    NameShort: 0,
    NameUint32: 0,
    NameInt: 0,
    NameFloat: 0,
    NameUint64: { high: 0, low: 0 },
    NameLong: { high: 0, low: 0 },
    NameDouble: 0,
  };
  expect(typeof val === 'object').toBeTruthy();
  expect(val).toEqual(init);
});

test('test with value in create', async () => {
  expect(HansWurstStructOfScalar.create(initHansWurstStructOfScalar)).toEqual(
    initHansWurstStructOfScalar,
  );
});

test('test reflection', async () => {
  // create
  const ret = HansWurstStructOfScalar.Reflection;
  expect(ret.prop).toEqual({
    alignFuncName: "byte",
    attributes: [
      {
        name: 'NameBoolean',
        notRequired: false,
        ofs: 0,
        type: new Definition.Types.Boolean()
      },
      {
        name: 'NameUint8',
        notRequired: false,
        ofs: 1,
        type: new Definition.Types.Uint8()
      },
      {
        name: 'NameChar',
        notRequired: false,
        ofs: 2,
        type: new Definition.Types.Char()
      },
      {
        name: 'NameUint16',
        notRequired: false,
        ofs: 3,
        type: new Definition.Types.Uint16()
      },
      {
        name: 'NameShort',
        notRequired: false,
        ofs: 5,
        type: new Definition.Types.Short()
      },
      {
        name: 'NameUint32',
        notRequired: false,
        ofs: 7,
        type: new Definition.Types.Uint32()
      },
      {
        name: 'NameInt',
        notRequired: false,
        ofs: 11,
        type: new Definition.Types.Int()
      },
      {
        name: 'NameFloat',
        notRequired: false,
        ofs: 15,
        type: new Definition.Types.Float()
      },
      {
        name: 'NameUint64',
        notRequired: false,
        ofs: 19,
        type: new Definition.Types.Uint64()
      },
      {
        name: 'NameLong',
        notRequired: false,
        ofs: 27,
        type: new Definition.Types.Long()
      },
      {
        name: 'NameDouble',
        notRequired: false,
        ofs: 35,
        type: new Definition.Types.Double()
      },
    ],
    bytes: 43,
    name: "StructOfScalar",
    // notRequire: false,
    type: 'Struct',
  });
});

// test('fromStream', () => {
//   fromStream(rb: Runtime.ReadStreamBuffer):
// })

test('toStream StructOfScalar', async () => {
  const data = HansWurstStructOfScalar.create(initHansWurstStructOfScalar);
  // console.log(data);
  const buf = await HansWurstStructOfScalar.toStream(data, new Runtime.StreamBuffer());
  const type = await HansWurstStructOfScalar.fromStream(
    new Runtime.StreamBuffer([buf.asUint8Array()]),
  );
  expect(Math.abs(data.NameFloat - type.NameFloat)).toBeLessThan(0.1);
  data.NameFloat = type.NameFloat;
  expect(Math.abs(data.NameDouble - type.NameDouble)).toBeLessThan(0.1);
  data.NameDouble = type.NameDouble;
  // console.log(type, data);
  expect(data).toEqual(type);
});

test('toStream StructOfNestStructOfScalar', async () => {
  const data = HansWurstStructOfNestedStruct.create(initHansWurstStructOfNestedStruct);
  // console.log(data);
  const buf = await HansWurstStructOfNestedStruct.toStream(data, new Runtime.StreamBuffer());
  const type = await HansWurstStructOfNestedStruct.fromStream(
    new Runtime.StreamBuffer([buf.asUint8Array()]),
  );
  expect(data).toEqual(type);
  // console.log(data);
});
// test('toStream', async () => {
//   const data = HansWurst.create();
//   console.log(data);
//   const buf = await HansWurst.toStream(data, new Runtime.StreamBuffer());
//   const type = await HansWurst.fromStream(new Runtime.StreamBuffer([buf.asUint8Array()]));
//   console.log(type, buf.asUint8Array());
// });
