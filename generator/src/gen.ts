import * as yargs from 'yargs';
import { Arguments } from 'yargs';
import { promisify } from 'util';
import * as fs from 'fs';
import ts = require('typescript');
import path = require('path');
import mkdirp = require('mkdirp');
import { Types } from 'flatterbuf';
import { Struct, TSGenerator, TSWriter, TSWriterArgs } from './ts';

const existsAsync = promisify(fs.exists);
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

class Config {
  public readonly tsWriter: Partial<TSWriterArgs>;
  public readonly outDir: string;
  public readonly genJs: boolean;
  constructor(
    private readonly pargs: { [key in keyof Arguments<unknown>]: Arguments<unknown>[key] },
  ) {
    this.tsWriter = {};
    this.outDir = (pargs.outDir as string) || '';
    this.genJs = !!pargs.genJs;
  }
  public tsConfig(): string {
    return this.pargs.tsconfig as string;
  }
  public tsFiles(): string[] {
    return this.pargs._.filter((i) => i.endsWith('.ts') || i.endsWith('.tsx'));
  }
  public jsFiles(): string[] {
    return this.pargs._.filter((i) => i.endsWith('.js'));
  }
  public jsxFiles(): string[] {
    throw Error('jsx babel is not implemented');
  }
}
interface TSCompiled {
  readonly exists: boolean;
  readonly fname: string;
  readonly error?: Error;
  readonly tsfile?: string;
  readonly jsfile?: ts.TranspileOutput;
  readonly jsfileName?: string;
  readonly evalModule?: any;
}

async function tscompile(config: Config, tsconfig: any): Promise<TSCompiled[]> {
  // console.log(`xxxx=>`, tsconfig)
  // const js = ts.transpileModule(inTs.written.toString(), config);
  return await Promise.all(
    config.tsFiles().map(async (fname) => {
      let exists = false;
      let tsfile: string | undefined;
      let jsfile: ts.TranspileOutput | undefined;
      let jsfileName: string | undefined;
      let error: Error | undefined;
      try {
        exists = await existsAsync(fname);
        tsfile = (await readFileAsync(fname)).toLocaleString();
        jsfile = ts.transpileModule(tsfile, tsconfig);
        const outDir = path.resolve(tsconfig.compilerOptions.outDir || '');
        const skipFirst = path.join(...fname.split(path.sep).slice(1));
        jsfileName = path.join(outDir, skipFirst.replace(/.tsx?$/, '.js'));
        if (outDir.length === 0) {
          const jsFileExist = await existsAsync(jsfileName);
          if (jsFileExist) {
            throw Error(`we can't override ${jsfileName}`);
          }
        }
        await mkdirp(path.dirname(jsfileName));
        await writeFileAsync(jsfileName, jsfile.outputText);
        if (jsfile.sourceMapText) {
          await writeFileAsync(`${jsfileName}.map`, jsfile.sourceMapText);
        }
      } catch (e) {
        error = e;
      }
      return {
        exists,
        error,
        fname,
        tsfile,
        jsfile,
        jsfileName,
      };
    }),
  );
}

function searchDefinition(set: Set<Types.Base.Definition<unknown>>, item: any) {
  if (item instanceof Types.Base.Definition) {
    set.add(item);
  } else if (typeof item === 'object') {
    Object.entries(item).forEach((val) => {
      searchDefinition(set, val[1]);
    });
  }
}

function getDefinitions(...exports: any[]): Types.Base.Definition<unknown>[] {
  const ret: Set<Types.Base.Definition<unknown>> = new Set();
  exports.forEach((item) => {
    searchDefinition(ret, item);
  });
  return Array.from(ret);
}

async function readTsConfig(config: Config) {
  const tsconfigFile = await (await readFileAsync(config.tsConfig())).toLocaleString();
  const tsconfig = ts.readConfigFile(config.tsConfig(), (path) => tsconfigFile).config;
  if (tsconfig.error) {
    throw Error(`tscompile failed to read tsconfig from:${config.tsConfig()}`);
  }
  return tsconfig;
}

export async function cmd(...args: string[]) {
  const pargs = yargs
    .option('tsconfig', {
      alias: 'c',
      describe: 'tsconfig',
      default: './tsconfig.json',
    })
    .option('genJs', {
      alias: 'g',
      type: 'boolean',
      describe: 'generate JS',
    })
    .option('outDir', {
      alias: 'o',
      describe: 'out Directory',
      default: '',
    })
  //   .command('$0 [files]', 'files to generate', (args) => {
  //     //   yargs.parse(args);
  //       console.log(args);
  //   })
    .parse(args);
  pargs._ = pargs._.filter((node, idx) => !(idx == 0 && node.includes('node'))).filter(
    (node, idx) => !(idx == 0 && node.includes(pargs.$0)),
  );
  const config = new Config(pargs);
  const filesToImport = [];
  const tsConfig = await readTsConfig(config);
  const tsResult = await tscompile(config, tsConfig);
  filesToImport.push(...tsResult.filter((i) => !i.error).map((i) => i.jsfileName));
  filesToImport.push(...config.jsFiles());
  // filesToImport.push(...config.jsxFiles());
  // console.log(tsResult, filesToImport)
  const imported = filesToImport.map((i) => {
    try {
      const my = require(i || '');
      return { jsFile: i, exports: my };
    } catch (e) {
      return { jsFile: i, error: e };
    }
  });
  const definitions = getDefinitions(
    ...imported.filter((i) => !i.error && typeof i.exports === 'object').map((i) => i.exports),
  );
  const tsWritten = await Promise.all(
    definitions
      .map((def) => {
        const tw = new TSWriter(config.tsWriter);
        TSGenerator(def, tw);
        return tw;
      })
      .reduce((r, i) => {
        r.push(...i.getStructs());
        return r;
      }, [] as Struct[])
      .map(async (i) => {
        const dest = `${path.join(
          config.outDir || tsConfig.compilerOptions.outDir || '',
          i.writer.fname,
        )}.ts`;
        console.log(`written TS:${dest}`);
        await mkdirp(path.dirname(dest));
        const tsfileStr = i.written!.toString();
        await writeFileAsync(dest, tsfileStr);
        if (config.genJs) {
          const jsFile = dest.replace(/.ts?$/, '.js');
          const jsTranspiled = ts.transpileModule(tsfileStr, tsConfig);
          console.log(`written JS:${jsFile}`);
          await writeFileAsync(jsFile, jsTranspiled.outputText);
          if (jsTranspiled.sourceMapText) {
            console.log(`written JS SourceMap:${jsFile}.map`);
            await writeFileAsync(`${jsFile}.map`, jsTranspiled.sourceMapText);
          }
        }
        return dest;
      }),
  );
  return tsWritten;
}

// cmd(...process.execArgv);

