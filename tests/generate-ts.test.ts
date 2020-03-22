import { TSGenerator, TSWriter } from '../src/generator/ts';
import { Definition } from '../src/definition';
import { Runtime } from '../src/runtime';
import { StructOfScalar } from './samples';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as ts from 'typescript';
import { forStatement } from '@babel/types';

// Definition.Types.ScalarTypesList.forEach(scalar => {
//   test('TS Generate Scalar', () => {

//   });
// })

function transpile(inTs: string) {
  const js = ts.transpileModule(inTs, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
    },
  });
  const fname = `${crypto
    .createHash('sha256')
    .update(js.outputText)
    .digest('hex')}.tmp.js`;
  const projectRelativ = `./tests/${fname}`;
  fs.writeFileSync(projectRelativ, js.outputText);
  const obj = require(`./${fname}`);
  // console.log(`TS=`, projectRelativ, inTs);
  fs.unlinkSync(projectRelativ);
  return obj;
}

let HansWurst: any;
const initHansWurst = {
  NameBoolean: true,
  NameUint8: 1,
  NameChar: 2,
  NameUint16: 3,
  NameShort: 4,
  NameUint32: 5,
  NameInt: 6,
  NameFloat: 9.9,
  NameUint64: { high: 77, low: 88 },
  NameLong: { high: 99, low: 1111 },
  NameDouble: 10.10,
};
beforeAll(() => {
  const my = TSGenerator(StructOfScalar(), new TSWriter({ runtimePath: '../src/runtime' }));
  HansWurst = transpile(my.getTs()).HansWurst;
  // console.log(my.getTs());
  // console.log(js.outputText);
  // const type = eval(js.outputText)
});

test('test default in create', async () => {
  // create
  const val = HansWurst.create();
  const init = {
    NameBoolean: false,
    NameUint8: 0,
    NameChar: 0,
    NameUint16: 0,
    NameShort: 0,
    NameUint32: 0,
    NameInt: 0,
    NameFloat: 0,
    NameUint64: { high: 0, low: 0 },
    NameLong: { high: 0, low: 0 },
    NameDouble: 0
  };
  expect(typeof val === 'object').toBeTruthy();
  expect(val).toEqual(init);
});

test('test with value in create', async () => {
  expect(HansWurst.create(initHansWurst)).toEqual(initHansWurst);
});

test('test reflection', async () => {
  // create
  const ret = HansWurst.Reflection;
  expect(ret.prop).toEqual({
    attributes: [
      {
        bytes: 1,
        initial: false,
        name: 'NameBoolean',
        notRequired: false,
        ofs: 0,
        type: 'Boolean',
      },
      {
        bytes: 1,
        initial: 0,
        name: 'NameUint8',
        notRequired: false,
        ofs: 1,
        type: 'Uint8',
      },
      {
        bytes: 1,
        initial: 0,
        name: 'NameChar',
        notRequired: false,
        ofs: 2,
        type: 'Char',
      },
      {
        bytes: 2,
        initial: 0,
        name: 'NameUint16',
        notRequired: false,
        ofs: 3,
        type: 'Uint16',
      },
      {
        bytes: 2,
        initial: 0,
        name: 'NameShort',
        notRequired: false,
        ofs: 5,
        type: 'Short',
      },
      {
        bytes: 4,
        initial: 0,
        name: 'NameUint32',
        notRequired: false,
        ofs: 7,
        type: 'Uint32',
      },
      {
        bytes: 4,
        initial: 0,
        name: 'NameInt',
        notRequired: false,
        ofs: 11,
        type: 'Int',
      },
      {
        bytes: 4,
        initial: 0,
        name: 'NameFloat',
        notRequired: false,
        ofs: 15,
        type: 'Float',
      },
      {
        bytes: 8,
        initial: Runtime.HighLow.defaultValue,
        name: 'NameUint64',
        notRequired: false,
        ofs: 19,
        type: 'Uint64',
      },
      {
        bytes: 8,
        initial: Runtime.HighLow.defaultValue,
        name: 'NameLong',
        notRequired: false,
        ofs: 27,
        type: 'Long',
      },
      {
        bytes: 8,
        initial: 0,
        name: 'NameDouble',
        notRequired: false,
        ofs: 35,
        type: 'Double',
      }
    ],
    bytes: 43,
    name: 'HansWurst',
    notRequired: false,
    ofs: 0,
    type: 'Struct',
  });
});

// test('fromStream', () => {
//   fromStream(rb: Runtime.ReadStreamBuffer):
// })

test('toStream', async () => {
  const data = HansWurst.create(initHansWurst);
  // console.log(data);
  const buf = await HansWurst.toStream(data, new Runtime.StreamBuffer());
  const type = await HansWurst.fromStream(new Runtime.StreamBuffer([buf.asUint8Array()]));
  expect(Math.abs(data.NameFloat - type.NameFloat)).toBeLessThan(0.1);
  data.NameFloat = type.NameFloat;
  expect(Math.abs(data.NameDouble - type.NameDouble)).toBeLessThan(0.1);
  data.NameDouble = type.NameDouble;
  // console.log(type, data);
  expect(data).toEqual(type);
});

// test('toStream', async () => {
//   const data = HansWurst.create();
//   console.log(data);
//   const buf = await HansWurst.toStream(data, new Runtime.StreamBuffer());
//   const type = await HansWurst.fromStream(new Runtime.StreamBuffer([buf.asUint8Array()]));
//   console.log(type, buf.asUint8Array());
// });