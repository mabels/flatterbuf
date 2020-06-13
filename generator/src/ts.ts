// import { Definition } from '../definition';
import { TSStructWriter } from './ts-struct-writer';
import { TSBitStructWriter } from './ts-bit-struct-writer';
import { Types, Optional } from 'flatterbuf';
// import { isNone } from '../definition/optional';
// import { HighLow } from '../definition/types/high-low';

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

export function tsStringify<B>(
  iobj: unknown,
  typ: Types.Base.Definition<B>,
  wr: TSWriter,
): string {
  const wl = new TSWriteLine(wr);
  const oval = typ.coerce(iobj);
  if (Optional.isNone(oval)) {
    return wl.toString();
  }
  const val = oval.some;
  switch (typ.type) {
    case Types.Boolean.Definition.type:
      wl.write(0, val ? 'true' : 'false');
      break;
    case Types.Char.Definition.type:
    case Types.Uint8.Definition.type:
    case Types.Uint16.Definition.type:
    case Types.Short.Definition.type:
    case Types.Uint32.Definition.type:
    case Types.Int.Definition.type:
    case Types.Float.Definition.type:
    case Types.Double.Definition.type:
      wl.write(0, `${val}`);
      break;
    case Types.Uint64.Definition.type:
    case Types.Long.Definition.type:
      const hl = val as Types.HighLow.Type;
      const out = [];
      if (typeof hl.low === 'number') {
        out.push(`low: ${hl.low}`);
      }
      if (typeof hl.high === 'number') {
        out.push(`high: ${hl.high}`);
      }
      wl.write(0, `{ ${out.join(', ')} }`);
      break;
    case Types.BitStruct.Definition.type:
      const bitStruct = typ as unknown as Types.BitStruct.Definition;
      const bobj = iobj as Record<string, unknown>;
      wl.writeLine(0, `{`);
      bitStruct.bits.forEach((bits) => {
        const bval = bobj[bits.name];
        if (Optional.isSome(bits.type.coerce(bval))) {
          wl.writeLine(1, `${bits.name}: ${tsStringify(bval, bits.type, wr)},`);
        }
      });
      wl.write(0, `}`);
      break;
    case Types.Struct.Definition.type:
      const struct = typ as Types.Struct.Definition;
      const obj = iobj as Record<string, unknown>;
      wl.writeLine(0, `{`);
      struct.attributes.forEach((attr) => {
        const sval = obj[attr.name];
        if (Optional.isSome(attr.type.coerce(sval))) {
          wl.writeLine(1, `${attr.name}: ${tsStringify(sval, attr.type, wr)},`);
        }
      });
      wl.write(0, `}`);
      break;
    case Types.FixedCString.Definition.type:
      // const stype = typeof val;
      // // wl.write(0, `/*${JSON.stringify(val)}*/`);
      // if (stype === 'string') {
      //   wl.write(0, wr.quote(val as string));
      // }
      // if (stype === 'number') {
      //   wl.write(0, `${val as number}`);
      // }
      // break;
    case Types.FixedArray.Definition.type:
      const atype = typ as unknown as Types.FixedArray.Definition<unknown>;
      const o = (val as unknown[]).map(i => tsStringify(i, atype.element, wr));
      wl.write(0, `[${o.join(', ')}]`);
      break;
    default:
      throw Error(`tsStringify failed for: ${typ.type}`);
  }
  return wl.toString();
}

export function typeDefinition<T>(
  t: Types.Base.Definition<T>,
  typeName: string,
  wrapStruct: (s: string) => string = (s) => s,
): string {
  switch (t.type) {
    case Types.Boolean.Definition.type:
      return 'boolean';
    case Types.Char.Definition.type:
    case Types.Uint8.Definition.type:
    case Types.Uint16.Definition.type:
    case Types.Short.Definition.type:
    case Types.Uint32.Definition.type:
    case Types.Int.Definition.type:
    case Types.Float.Definition.type:
    case Types.Double.Definition.type:
      return 'number';
    case Types.Uint64.Definition.type:
    case Types.Long.Definition.type:
      return wrapStruct(`Types.${t.type}.${typeName}`);
    case Types.BitStruct.Definition.type:
      return wrapStruct(`${((t as unknown) as Types.BitStruct.Definition).name}.${typeName}`);
    case Types.Struct.Definition.type:
      return wrapStruct(`${((t as unknown) as Types.Struct.Definition).name}.${typeName}`);
    case Types.FixedCString.Definition.type:
      return `number[]`;
    case Types.FixedArray.Definition.type:
      return (
        typeDefinition(((t as unknown) as Types.FixedArray.Definition<unknown>).element, typeName, wrapStruct) + '[]'
      );
    default:
      throw Error(`typeDefinition failed for: ${t.type}`);
  }
}

export function attributeDefinition(def: Types.Struct.BaseAttribute) {
  // return def.name + (def.notRequired ? '?' : '');
  return def.name;
}

export function initialValue<T>(
  _wr: TSWriter,
  vname: string,
  def: Types.Base.Definition<T>,
): string {
  switch (def.type) {
    case Types.Uint64.Definition.type:
    case Types.Long.Definition.type:
    // const hl = (def as Types.ScalarType<Runtime.Types.HighLow.Type>).initial;
    // return `{ high: ${hl.high}, low: ${hl.low} }`;
    case Types.FixedCString.Definition.type:
    case Types.BitStruct.Definition.type:
      return `dkdkfk:${def.type}:${vname}`;
    case Types.Boolean.Definition.type:
    // return (def as Types.ScalarType<boolean>).initial.toString();
    case Types.Char.Definition.type:
    case Types.Uint8.Definition.type:
    case Types.Uint16.Definition.type:
    case Types.Short.Definition.type:
    case Types.Uint32.Definition.type:
    case Types.Int.Definition.type:
    case Types.Float.Definition.type:
    case Types.Double.Definition.type:
    // return (def as Types.ScalarType<number>).initial.toString();
    case Types.Struct.Definition.type:
    case Types.FixedArray.Definition.type:
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
  // readonly runtimePath: string;
  readonly definitionPath: string;
  readonly generationPath: string;
  readonly quote: string;
  readonly indent: string;
}

export interface Struct {
  readonly writer: TSRefWriter;
  written?: TSWriteLine;
}
export interface FixedArray {
  readonly writer: TSRefWriter;
  written?: TSWriteLine;
}

export class TSWriter {
  public readonly structs: Map<string, Struct> = new Map();
  public readonly fixedArrays: Map<string, FixedArray> = new Map();
  public args: TSWriterArgs;
  constructor(args: Partial<TSWriterArgs> = {}) {
    this.args = {
      indent: args.indent || '  ',
      ...args,
      quote: args!.quote || "'",
      generationPath: args!.generationPath || './',
      // runtimePath: args!.runtimePath || 'flatterbuf/runtime',
      definitionPath: args!.definitionPath || 'flatterbuf',
    };
  }

  public indent(level: number) {
    return Array(level).fill(this.args.indent).join('');
  }

  public quote(val: string): string {
    return `${this.args.quote}${val.replace(
      new RegExp(this.args.quote, 'g'),
      `\\${this.args.quote}`,
    )}${this.args.quote}`;
  }

  public backQuote(val: string): string {
    return `\`${val.replace(
      new RegExp('`', 'g'),
      `\\\``,
    )}\``;
  }

  public structClass(def: Types.Struct.Definition, level: number) {
    let tsw = this.structs.get(def.name);
    if (!tsw) {
      tsw = { writer: new TSStructWriter(def, level, this.args) };
      this.structs.set(tsw.writer.def.name, tsw);
    }
    return tsw;
  }

  public bitStructClass(def: Types.BitStruct.Definition, level: number) {
    let tsw = this.structs.get(def.name);
    if (!tsw) {
      tsw = { writer: new TSBitStructWriter(def, this.args) };
      this.structs.set(tsw.writer.def.name, tsw);
    }
    return tsw;
  }

  // public fixedArrayClass<B>(def: Types.FixedArray.Definition<B>, name: string) {
  //   let tsw = this.fixedArrays.get(def.name);
  //   if (!tsw) {
  //     tsw = { writer: new TSBitStructWriter(def, this.args) };
  //     this.structs.set(tsw.writer.def.name, tsw);
  //   }
  //   return tsw;
  // }

  public generator<T>(def: Types.Base.Definition<T>): TSWriter {
    if (Types.isFixedArray(def)) {
      throw Error(`Implement-Array:${def.type}`);
    } else if (Types.isStruct(def)) {
      if (def.type === Types.Struct.Definition.type) {
        this.structClass((def as unknown) as Types.Struct.Definition, 0);
        return this;
      }
    } else if (Types.isScalar(def)) {
      if (def.type === Types.BitStruct.Definition.type) {
        this.bitStructClass((def as unknown) as Types.BitStruct.Definition, 0);
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
      ret = Array.from(this.structs.values()).map((i) => {
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

export function TSGenerator<T>(def: Types.Base.Definition<T>, writer = new TSWriter()): TSWriter {
  return writer.generator(def);
}
