import { Definition } from '../definition';
import { TSStructWriter } from './ts-struct-writer';
import { TSBitStructWriter } from './ts-bit-struct-writer';

export class TSWriteLine {
  private readonly lines: string[] = [];

  constructor(public wr: TSWriter) {}

  public prependLine(i: number, line: string) {
    this.action(i, line, true, Array.prototype.unshift);
  }
  public prepend(i: number, line: string) {
    this.action(i, line, false, Array.prototype.unshift);
  }

  public writeLine(i: number, lines: string) {
    this.action(i, lines, true, Array.prototype.push);
  }
  public write(i: number, lines: string) {
    this.action(i, lines, false, Array.prototype.push);
  }
  public action(i: number, lines: string, appendNewLine: boolean, action: (s: string) => void) {
    const indent = this.wr.indent(i);
    const args = lines.split('\n').map((line, idx, spnl) => {
      let trimmed = line.trimEnd();
      if (trimmed.length) {
        trimmed = indent + trimmed;
      }
      if (appendNewLine || idx < spnl.length - 1) {
        trimmed += '\n';
      }
      return trimmed;
    });
    // console.log(`action=>`, args)
    action.apply(this.lines, args);
  }

  public toString() {
    const ret = this.lines.join('');
    this.toString = () => ret;
    return ret;
  }
}

export function writeCloneFunction(wl: TSWriteLine) {
  wl.writeLine(1, `\nexport function clone(prop?: { initial?: Partial<Type> }): Type {`);
  wl.writeLine(2, `return Reflection.create(typeof prop === 'object' ? prop.initial : undefined);`);
  wl.writeLine(1, `}\n`);
}

export function typeDefinition<T>(t: Definition.Types.Type<T>, wrapStruct: (s: string) => string = (s) => s): string {
  switch (t.type) {
    case Definition.Types.Boolean.type:
      return 'boolean';
    case Definition.Types.Char.type:
    case Definition.Types.Uint8.type:
    case Definition.Types.Uint16.type:
    case Definition.Types.Short.type:
    case Definition.Types.Uint32.type:
    case Definition.Types.Int.type:
    case Definition.Types.Float.type:
    case Definition.Types.Double.type:
      return 'number';
    case Definition.Types.Uint64.type:
    case Definition.Types.Long.type:
      return wrapStruct('__Definition.Types.HighLow');
    case Definition.Types.BitStruct.type:
      return wrapStruct(`${((t as unknown) as Definition.Types.BitStruct).name}.Type`);
    case Definition.Types.Struct.type:
      return wrapStruct(`${((t as unknown) as Definition.Types.Struct).name}.Type`);
    case Definition.Types.FixedCString.type:
      return `number[]`;
    case Definition.Types.FixedArray.type:
      return (
        typeDefinition(((t as unknown) as Definition.Types.FixedArray<unknown>).element) + '[]'
      );
    default:
      throw Error(`typeDefinition failed for: ${t.type}`);
  }
}

export function attributeDefinition(def: Definition.Types.StructBaseAttribute) {
  // return def.name + (def.notRequired ? '?' : '');
  return def.name;
}

export function initialValue<T>(
  _wr: TSWriter,
  vname: string,
  def: Definition.Types.Type<T>,
): string {
  switch (def.type) {
    case Definition.Types.Uint64.type:
    case Definition.Types.Long.type:
    // const hl = (def as Definition.Types.ScalarType<Runtime.Types.HighLow.Type>).initial;
    // return `{ high: ${hl.high}, low: ${hl.low} }`;
    case Definition.Types.FixedCString.type:
    case Definition.Types.BitStruct.type:
      return `dkdkfk:${def.type}:${vname}`;
    case Definition.Types.Boolean.type:
    // return (def as Definition.Types.ScalarType<boolean>).initial.toString();
    case Definition.Types.Char.type:
    case Definition.Types.Uint8.type:
    case Definition.Types.Uint16.type:
    case Definition.Types.Short.type:
    case Definition.Types.Uint32.type:
    case Definition.Types.Int.type:
    case Definition.Types.Float.type:
    case Definition.Types.Double.type:
    // return (def as Definition.Types.ScalarType<number>).initial.toString();
    case Definition.Types.Struct.type:
    case Definition.Types.FixedArray.type:
      // return `Reflection.attributes[${wr.quote(sdef.name)}].initial`;
      return `${vname}`;
    default:
      throw Error(`initialValue failed for: ${vname} => ${def.type}`);
  }
}

export interface TSRefWriter {
  readonly def: { name: string };
  readonly fname: string;
  write(wr: TSWriter): TSWriteLine;
}

export interface TSImportArgs<T> {
  readonly external?: {
    readonly fname: string;
    readonly def: string;
  };
  readonly sWriter?: TSRefWriter;
}

export interface TSWriterArgs {
  readonly runtimePath: string;
  readonly definitionPath: string;
  readonly generationPath: string;
  readonly quote: string;
  readonly indent: string;
}

export interface Struct {
  readonly writer: TSRefWriter;
  written?: TSWriteLine;
}

export class TSWriter {
  public readonly structs: Map<string, Struct> = new Map();
  public args: TSWriterArgs;
  constructor(args: Partial<TSWriterArgs> = {}) {
    this.args = {
      indent: args.indent || '  ',
      ...args,
      quote: args!.quote || "'",
      generationPath: args!.generationPath || './',
      runtimePath: args!.runtimePath || 'flatterbuf/runtime',
      definitionPath: args!.definitionPath || 'flatterbuf/definition',
    };
  }

  public indent(level: number) {
    return Array(level)
      .fill(this.args.indent)
      .join('');
  }

  public quote(val: string): string {
    return `${this.args.quote}${val.replace(
      new RegExp(this.args.quote, 'g'),
      `\\${this.args.quote}`,
    )}${this.args.quote}`;
  }

  public structClass(def: Definition.Types.Struct, level: number) {
    let tsw = this.structs.get(def.name);
    if (!tsw) {
      tsw = { writer: new TSStructWriter(def, level, this.args) };
      this.structs.set(tsw.writer.def.name, tsw);
    }
    return tsw;
  }

  public bitStructClass(def: Definition.Types.BitStruct, level: number) {
    let tsw = this.structs.get(def.name);
    if (!tsw) {
      tsw = { writer: new TSBitStructWriter(def, this.args) };
      this.structs.set(tsw.writer.def.name, tsw);
    }
    return tsw;
  }

  public generator<T>(def: Definition.Types.Type<T>): TSWriter {
    if (Definition.Types.isFixedArray(def)) {
      throw Error(`Implement-Array:${def.type}`);
    } else if (Definition.Types.isStruct(def)) {
      if (def.type === Definition.Types.Struct.type) {
        this.structClass((def as unknown) as Definition.Types.Struct, 0);
        return this;
      }
    } else if (Definition.Types.isScalar(def)) {
      if (def.type === Definition.Types.BitStruct.type) {
        this.bitStructClass((def as unknown) as Definition.Types.BitStruct, 0);
        return this;
      }
      throw Error(`Implement-Scalar:${def.type}`);
    }
    throw Error(`Unknown Type:${def.type}`);
  }

  // public getImports() {}

  public getStructs() {
    let ret: Struct[];
    let preSize = 0;
    do {
      // first pass
      preSize = this.structs.size;
      // console.log('getStruct-1=', preSize);
      ret = Array.from(this.structs.values()).map(i => {
        if (!i.written) {
          i.written = i.writer.write(this);
        }
        return i;
      });
    } while (this.structs.size != preSize);
    // console.log('getStruct-2=', preSize);
    return ret;
  }
  // public getTs() {
  //   return this.getStructs();
  //   // return [this.getImports(), this.getStructs()].join('\n');
  // }
}

export function TSGenerator<T>(def: Definition.Types.Type<T>, writer = new TSWriter()): TSWriter {
  return writer.generator(def);
}
