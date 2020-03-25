import { TSGenerator, TSWriter, TSStructWriter } from '../src/generator/ts';
import { Definition } from '../src/definition';
import { Runtime } from '../src/runtime';
import { Samples } from './samples';
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
  return inTss.map(inTs => {
    // console.log(`transpile =>`, inTss.length, inTs.fname);
    const js = ts.transpileModule(inTs.toString(), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
      },
    });
    const jsfile = `${ProjectRelativ}/${inTs.fname}.js`;
    fs.writeFileSync(jsfile, js.outputText);
    const tsfile = `${ProjectRelativ}/${inTs.fname}.ts`;
    fs.writeFileSync(tsfile, inTs.toString());
    return {
      jsfile, tsfile
    }
  }).map(i => ({
    ...i,
    ref: require(`./${TmpId}/${inTss[0].fname}`)
  })).map(i => {
    fs.unlinkSync(i.jsfile);
    fs.unlinkSync(i.tsfile);
    return i;
  });
}


describe('Generator', () => {
  let Tests: {
    transpiled: {
      jsfile: string;
      tsfile: string;
      ref: any;
    }[],
    clazz: any;
    sample: {
      Type: Definition.Types.Struct;
      Init: any;
    };
  }[] = Samples.Tests.map(i => {
    const my = TSGenerator(
      i.Type,
      new TSWriter({
        runtimePath: '../../src/runtime',
        definitionPath: '../../src/definition',
      }),
    );
    const transpiled = transpile(my.getStructs());
    return {
      transpiled,
      clazz: transpiled[0].ref[i.Type.name],
      sample: i,
    };
  });
  fs.rmdirSync(ProjectRelativ);

  Tests.forEach(tcase => {
    describe(tcase.sample.Type.name, () => {
      test(`reflection`, () => {
        expect(tcase.clazz.Reflection.prop).toEqual(tcase.sample.Type);
      });
      test(`empty create`, () => {
        const data = tcase.clazz.create();
        const buf = tcase.clazz.toStream(data, new Runtime.StreamBuffer());
        const type = tcase.clazz.fromStream(new Runtime.StreamBuffer([buf.asUint8Array()]));
        expect(data).toEqual(type);
      });
      test(`init create`, () => {
        const data = tcase.clazz.create(tcase.sample.Init);
        const buf = tcase.clazz.toStream(data, new Runtime.StreamBuffer());
        const type = tcase.clazz.fromStream(new Runtime.StreamBuffer([buf.asUint8Array()]));
        expect(tcase.sample.Init).toEqual(type);
      });
    });
  });
});

// test('test default in create', async () => {
//   // create
//   const val = HansWurstStructOfScalar.create();
//   const init = {
//     NameBoolean: false,
//     NameUint8: 0,
//     NameChar: ' ',
//     NameUint16: 0,
//     NameShort: 0,
//     NameUint32: 0,
//     NameInt: 0,
//     NameFloat: 0,
//     NameUint64: { high: 0, low: 0 },
//     NameLong: { high: 0, low: 0 },
//     NameDouble: 0,
//   };
//   expect(typeof val === 'object').toBeTruthy();
//   expect(val).toEqual(init);
// });

// test('test with value in create', async () => {
//   expect(HansWurstStructOfScalar.create(initHansWurstStructOfScalar)).toEqual(
//     initHansWurstStructOfScalar,
//   );
// });

// test('test reflection', async () => {
//   // create
//   const ret = HansWurstStructOfScalar.Reflection;
//   expect(ret.prop).toEqual({
//     alignFuncName: 'byte',
//     attributes: [
//       {
//         name: 'NameBoolean',
//         notRequired: false,
//         ofs: 0,
//         type: new Definition.Types.Boolean(),
//       },
//       {
//         name: 'NameUint8',
//         notRequired: false,
//         ofs: 1,
//         type: new Definition.Types.Uint8(),
//       },
//       {
//         name: 'NameChar',
//         notRequired: false,
//         ofs: 2,
//         type: new Definition.Types.Char(),
//       },
//       {
//         name: 'NameUint16',
//         notRequired: false,
//         ofs: 3,
//         type: new Definition.Types.Uint16(),
//       },
//       {
//         name: 'NameShort',
//         notRequired: false,
//         ofs: 5,
//         type: new Definition.Types.Short(),
//       },
//       {
//         name: 'NameUint32',
//         notRequired: false,
//         ofs: 7,
//         type: new Definition.Types.Uint32(),
//       },
//       {
//         name: 'NameInt',
//         notRequired: false,
//         ofs: 11,
//         type: new Definition.Types.Int(),
//       },
//       {
//         name: 'NameFloat',
//         notRequired: false,
//         ofs: 15,
//         type: new Definition.Types.Float(),
//       },
//       {
//         name: 'NameUint64',
//         notRequired: false,
//         ofs: 19,
//         type: new Definition.Types.Uint64(),
//       },
//       {
//         name: 'NameLong',
//         notRequired: false,
//         ofs: 27,
//         type: new Definition.Types.Long(),
//       },
//       {
//         name: 'NameDouble',
//         notRequired: false,
//         ofs: 35,
//         type: new Definition.Types.Double(),
//       },
//     ],
//     bytes: 43,
//     name: 'StructOfScalar',
//     // notRequire: false,
//     type: 'Struct',
//   });
// });

// // test('fromStream', () => {
// //   fromStream(rb: Runtime.ReadStreamBuffer):
// // })
// [undefined, initHansWurstStructOfScalar].forEach(initVal =>
//   test('toStream StructOfScalar', async () => {
//     const data = HansWurstStructOfScalar.create(initVal);
//     // console.log(data);
//     const buf = await HansWurstStructOfScalar.toStream(data, new Runtime.StreamBuffer());
//     const type = await HansWurstStructOfScalar.fromStream(
//       new Runtime.StreamBuffer([buf.asUint8Array()]),
//     );
//     expect(Math.abs(data.NameFloat - type.NameFloat)).toBeLessThan(0.1);
//     data.NameFloat = type.NameFloat;
//     expect(Math.abs(data.NameDouble - type.NameDouble)).toBeLessThan(0.1);
//     data.NameDouble = type.NameDouble;
//     // console.log(type, data);
//     expect(data).toEqual(type);
//   }),
// );

// [undefined, initHansWurstStructOfNestedStruct].forEach(initVal =>
// test('toStream StructOfNestStructOfScalar', async () => {
//   const data = HansWurstStructOfNestedStruct.create(initVal);
//   // console.log(data);
//   const buf = await HansWurstStructOfNestedStruct.toStream(data, new Runtime.StreamBuffer());
//   const type = await HansWurstStructOfNestedStruct.fromStream(
//     new Runtime.StreamBuffer([buf.asUint8Array()]),
//   );
//   expect(data).toEqual(type);
//   // console.log(data);
// })
// );

// [undefined, initHansWurstStructOfNestedArrayOfScalar].forEach(initVal =>
// test('toStream StructOfNestedArrayOfScalar', async () => {
//   const data = HansWurstStructOfNestedArrayOfScalar.create(
//     initHansWurstStructOfNestedArrayOfScalar,
//   );
//   // console.log(data);
//   const buf = await HansWurstStructOfNestedArrayOfScalar.toStream(data, new Runtime.StreamBuffer());
//   const type = await HansWurstStructOfNestedArrayOfScalar.fromStream(
//     new Runtime.StreamBuffer([buf.asUint8Array()]),
//   );
//   expect(data).toEqual(type);
//   console.log(data);
// })
// )

// test('toStream', async () => {
//   const data = HansWurst.create();
//   console.log(data);
//   const buf = await HansWurst.toStream(data, new Runtime.StreamBuffer());
//   const type = await HansWurst.fromStream(new Runtime.StreamBuffer([buf.asUint8Array()]));
//   console.log(type, buf.asUint8Array());
// });
