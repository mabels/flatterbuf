import { TSGenerator, TSWriter, Struct } from '../src/generator/ts';
// import { Definition } from '../src/definition';
// import { Runtime } from '../src/runtime';
import { Samples } from './samples';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as ts from 'typescript';
import { Types, StreamBuffer } from '../src/definition';

function filterFunc(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(i => filterFunc(i));
  }
  if (typeof obj === 'object') {
    const ret: any = {};
    Object.entries(obj).forEach(([key, val]) => {
      ret[key] = filterFunc(val);
    });
    return ret;
  }
  if (typeof obj === 'function') {
    return '[Function]';
  }
  return obj;
}

// Definition.Types.ScalarTypesList.forEach(scalar => {
//   test('TS Generate Scalar', () => {

//   });
// })
const TempDirectoryName = `${crypto
  .createHash('sha256')
  .update(Math.random().toString())
  .digest('hex')}.tmp`;
const ProjectRelativ = `./tests/${TempDirectoryName}`;
// console.log(`WTF=>`, projectRelativ);
fs.mkdirSync(ProjectRelativ);

const Files: string[] = [];

function transpile<T>(inTss: Struct[]) {
  return inTss
    .map(inTs => {
      const config = ts.readConfigFile('./tsconfig.json', (path) => fs.readFileSync(path).toString()).config;
      const js = ts.transpileModule(inTs.written.toString(), config);
      // debugger;
      const jsfile = `${ProjectRelativ}/${inTs.writer.fname}.js`;
      fs.writeFileSync(jsfile, js.outputText);
      const tsfile = `${ProjectRelativ}/${inTs.writer.fname}.ts`;
      fs.writeFileSync(tsfile, inTs.written.toString());
      return {
        jsfile,
        tsfile,
        inTs,
      };
    })
    .map(i => ({
      ...i,
      ref: require(`./${TempDirectoryName}/${i.inTs.writer.fname}`),
    }))
    .map(i => {
      // fs.unlinkSync(i.jsfile);
      // fs.unlinkSync(i.tsfile);
      return i;
    });
}

describe(`Generator:${TempDirectoryName}`, () => {
  let Tests: {
    transpiled: {
      jsfile: string;
      tsfile: string;
      ref: {};
    }[];
    clazzes: any;
    sample: {
      Type: Types.Struct.Definition;
      Init: any;
      Default: any;
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
    const refs = transpiled.map(j => j.ref);
    // console.log(refs);
    return {
      transpiled,
      clazzes: refs.reduce((r, j) => ({ ...r, ...j }), {}),
      sample: i,
    };
  });
  // fs.rmdirSync(ProjectRelativ);

  Tests.forEach(tcase => {
    // console.log(Object.entries<any>(tcase.clazzes));
    Object.entries<any>(tcase.clazzes)
      .filter(([key, _]) => key.match(/struct/i))
      .forEach(([key, clazz]) => {
        describe(key, () => {
          // console.log('XXXXXX=>', tcase, key);
          test(`reflection`, () => {
            // console.log('prop=>', clazz.Reflection.prop.attributes[1].type.initial);
            // console.log('type=>', tcase.sample.Type.attributes[1].type.initial);
            const def: Types.Struct.Definition = new clazz.Definition();
            debugger;
            expect(filterFunc(def)).toEqual(filterFunc(tcase.sample.Type));
            // expect(clazz.Reflection.attributes).toEqual(clazz.Reflection.attributes.reduce((r: any, attr: any) => {
            //   r[attr.name] = attr;
            //   return r;
            // }, {}));
            // expect(clazz.Reflection.initial).toEqual(clazz.Reflection.attributes.reduce((r: any, attr: any) => {
            //   r[attr.name] = attr.type.initial;
            //   return r;
            // }, {}));
          });
          test(`empty create`, () => {
            // console.log(clazz);
            const def: Types.Struct.Definition = new clazz.Definition();
            const data = def.create();
            expect(data).toEqual(tcase.sample.Default);
            const buf = def.toStream(data, new StreamBuffer());
            // console.log('data', buf, buf.asUint8Array(), data, tcase.sample.Default);
            const type = clazz.Definition.fromStream(new StreamBuffer([buf.asUint8Array()]));
            // console.log(data, type);
            expect(data).toEqual(type);
          });

          test(`init create`, () => {
            const def: Types.Struct.Definition = new clazz.Definition();
            const data = def.create(tcase.sample.Init);
            expect(tcase.sample.Init).toEqual(data);
            const buf = def.toStream(data, new StreamBuffer());
            const type = clazz.Definition.fromStream(new StreamBuffer([buf.asUint8Array()]));
            // console.log(data, buf.asUint8Array());
            expect(tcase.sample.Init).toEqual(type);
          });

          test(`def init create`, () => {
            debugger;
            const def: Types.Struct.Definition = new clazz.Definition({initial: tcase.sample.Init});
            const data = def.create();
            expect(data).toEqual(tcase.sample.Init);
            const buf = def.toStream(data, new StreamBuffer());
            const type = clazz.Definition.fromStream(new StreamBuffer([buf.asUint8Array()]));
            // console.log(data, buf.asUint8Array());
            expect(tcase.sample.Init).toEqual(type);
          });
        });
      });
  });
});
