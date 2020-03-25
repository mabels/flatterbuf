import { Definition } from '../definition';
import { Type } from 'typescript';
import { Runtime } from '../runtime';
import { wrap } from 'module';

export class TSWriteLine {
  readonly lines: string[] = [];

  public prependLine(i: number, line: string) {
    this.action(i, line + '\n', Array.prototype.unshift);
  }
  public prepend(i: number, line: string) {
    this.action(i, line, Array.prototype.unshift);
  }

  public writeLine(i: number, line: string) {
    this.write(i, line + '\n');
  }
  public write(i: number, line: string) {
    this.action(i, line, Array.prototype.push);
  }
  public action(i: number, str: string, action: (s: string) => void) {
    action.apply(this.lines, [
      Array(i * 2)
        .fill(' ')
        .join('') + str
    ]);
  }

  public toString() {
    return this.lines.join('');
  }
}

export function typeDefinition(t: Definition.Types.Type): string {
  switch (t.type) {
    case Definition.Types.Boolean.type:
      return 'boolean';
    case Definition.Types.Char.type:
      return 'string';
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
      return 'Runtime.HighLow.Type';
    case Definition.Types.Struct.type:
      return `${(t as Definition.Types.Struct).name}.Type`;
    case Definition.Types.FixedArray.type:
      return typeDefinition((t as Definition.Types.FixedArray).element) + '[]';
    default:
      throw Error(`Scalar2Ts failed for: ${t.type}`);
  }
}

export function attributeDefinition(def: Definition.Types.StructAttributeOfs) {
  return def.name + (def.notRequired ? '?' : '');
}

// export function scalar2default(t: Definition.Types.ScalarType<unknown>): string {
//   switch (t.type) {
//     case Definition.Types.Boolean.type:
//       return t.initial ? 'true' : 'false';
//     case Definition.Types.Char.type:
//       return ' ';
//     case Definition.Types.Uint8.type:
//     case Definition.Types.Uint16.type:
//     case Definition.Types.Short.type:
//     case Definition.Types.Uint32.type:
//     case Definition.Types.Int.type:
//     case Definition.Types.Float.type:
//     case Definition.Types.Double.type:
//       return '' + ~~t.initial;
//     case Definition.Types.Uint64.type:
//     case Definition.Types.Long.type:
//       return '{ high: 0, low: 0 }';
//     default:
//       throw Error(`Scalar2Ts failed for: ${t.type}`);
//   }
// }

function initialValue(wr: TSWriter, def: Definition.Types.Type): string {
  switch (def.type) {
    case Definition.Types.Boolean.type:
      return (def as Definition.Types.ScalarType<boolean>).initial.toString();
      break;
    case Definition.Types.Char.type:
      return wr.quote((def as Definition.Types.ScalarType<string>).initial);
      break;
    case Definition.Types.Uint8.type:
    case Definition.Types.Uint16.type:
    case Definition.Types.Short.type:
    case Definition.Types.Uint32.type:
    case Definition.Types.Int.type:
    case Definition.Types.Float.type:
    case Definition.Types.Double.type:
      return (def as Definition.Types.ScalarType<number>).initial.toString();
    case Definition.Types.Uint64.type:
    case Definition.Types.Long.type:
      const hl = (def as Definition.Types.ScalarType<Runtime.HighLow.Type>).initial;
      return `{ high: ${hl.high}, low: ${hl.low} }`;
    case Definition.Types.Struct.type:
    case Definition.Types.FixedArray.type:
    default:
      throw Error(`initialValue failed for: ${def.type}`);
  }
}

export class TSStructWriter {
  readonly wl = new TSWriteLine();
  public readonly fname: string;

  private written = false; // SideEffect not moderated

  readonly imports = new Map<string, TSImport>();

  constructor(
    public readonly def: Definition.Types.Struct,
    public readonly level: number,
    public readonly args: TSWriterArgs,
  ) {
    const defintion = new TSImport({
      external: {
        def: 'Definition',
        fname: args.definitionPath || 'flatterbuf/definition'
      }
    });
    this.imports.set(defintion.name, defintion);
    const runtime = new TSImport({
      external: {
        def: 'Runtime',
        fname: args.runtimePath || 'flatterbuf/runtime'
      }
    });
    this.imports.set(runtime.name, runtime);
    this.fname = `${args.generationPath}${this.def.name.toLowerCase()}`;
  }

  public writeStructAttributeReflection(
    wr: TSWriter,
    attr: Definition.Types.StructAttributeOfs,
    comma: string,
    ident = 2,
    wl = this.wl
    // level: number,
    // ident: number,
    // ofs: number,
    // def: Definition.Types.Type,
    // wl: TSWriteLine,
    // name?: string,
  ) {
    wl.writeLine(comma.length ? 0 : ident, `${comma}{`);
    wl.writeLine(ident + 1, `name: ${wr.quote(attr.name)},`);
    // wl.writeLine(ident + 1, `ofs: ${attr.ofs},`);

    wl.writeLine(ident + 1, `type: ${this.getTypeDefinition(ident + 2, wr, attr.type)}`);
    wl.write(ident, `}`);
  }

  public getTypeDefinition(ident: number, wr: TSWriter, attr: Definition.Types.Type): string {
    const wl = new TSWriteLine();
    switch (attr.type) {
      case Definition.Types.Boolean.type:
        wl.writeLine(0, `new Definition.Types.Boolean({`);
        wl.writeLine(ident + 2, `initial: ${!!(attr as Definition.Types.ScalarType<boolean>).initial}`);
        wl.write(ident + 1, `})`);
        break;
      case Definition.Types.Char.type:
        wl.writeLine(0, `new Definition.Types.Char({`);
        wl.writeLine(ident + 2, `initial: ${wr.quote((attr as Definition.Types.ScalarType<string>).initial)}`);
        wl.write(ident + 1, `})`);
        break;
      case Definition.Types.Uint8.type:
      case Definition.Types.Uint16.type:
      case Definition.Types.Short.type:
      case Definition.Types.Uint32.type:
      case Definition.Types.Int.type:
      case Definition.Types.Float.type:
      case Definition.Types.Double.type:
        wl.writeLine(0, `new Definition.Types.${attr.type}({`);
        wl.writeLine(ident + 2, `initial: ${(attr as Definition.Types.ScalarType<number>).initial}`);
        wl.write(ident + 1, `})`);
        break;
      case Definition.Types.Uint64.type:
      case Definition.Types.Long.type:
        {
          const val = { high: 0, low: 0 };
          const sdef = (attr as Definition.Types.ScalarType<Runtime.HighLow.Type>).initial;
          if (sdef && typeof sdef.high) {
            val.high = sdef.high;
          }
          if (sdef && typeof sdef.low) {
            val.low = sdef.low;
          }
          wl.writeLine(0, `new Definition.Types.${attr.type}({`);
          wl.writeLine(ident + 2, `initial: { high: ${val.high}, low: ${val.low} }`);
          wl.write(ident + 1, `})`);
        }
        break;
      case Definition.Types.Struct.type:
        const sdef = attr as Definition.Types.Struct;
        this.addTypeReference(wr, sdef);
        wl.writeLine(ident + 1, `${sdef.name}.Reflection.prop`);
        break;
      case Definition.Types.FixedArray.type:
        const adef = attr as Definition.Types.FixedArray;
        wl.writeLine(0, `new Definition.Types.FixedArray({`);
        wl.writeLine(ident + 2, `length: ${adef.length},`);
        wl.writeLine(ident + 2, `alignFuncName: ${wr.quote(adef.alignFuncName)},`);
        wl.writeLine(ident + 2, `element: ${this.getTypeDefinition(ident + 3, wr, adef.element)},`);
        wl.write(ident + 1, `})`);
        break;
      default:
        throw Error(`Scalar2Ts failed for: ${attr.type}`);
    }
    return wl.toString();
  }

  public addTypeReference(wr: TSWriter, def: Definition.Types.Type) {
    if (Definition.Types.isScalar(def)) {
      return;
    }
    if (Definition.Types.isFixedArray(def)) {
      const adef = def as Definition.Types.FixedArray;
      throw Error('need');
      // const m = new TSImport({
      //   fname: `${wr.args.generationPath}/${adef.}`,
      //   adef.element.type
      // });
      // this.imports.set(m.name, m);
    }
    if (Definition.Types.isStruct(def)) {
      const sdef = def as Definition.Types.Struct;
      const tsw = wr.structClass(sdef, this.level + 1);
      const m = new TSImport({ sWriter: tsw });
      // console.log('addTypeReference of ', this.fname, sdef.name, m.name);
      this.imports.set(m.name, m);
      return;
    }
    throw Error(`addTypeReferenced for unknown type:${def.type}`);
  }

  writeInterface(wr: TSWriter) {
    this.wl.writeLine(1, `export interface Type {`);
    this.def.attributes.forEach(i => {
      this.addTypeReference(wr, i.type);
      this.wl.writeLine(2, `readonly ${attributeDefinition(i)}: ${typeDefinition(i.type)};`);
    });
    this.wl.writeLine(1, '}');
  }

  writeReflection(wr: TSWriter) {
    this.wl.writeLine(1, `export const Reflection = new Runtime.Reflection(new Definition.Types.Struct({`);
    this.wl.writeLine(2, `name: ${wr.quote(this.def.name)},`);
    this.wl.writeLine(2, `alignFuncName: ${wr.quote(this.def.alignFuncName)},`);
    // this.wl.writeLine(2, `notRequire: ${!!this.def.notRequire},`);
    this.wl.writeLine(2, `attributes: [`);
    this.def.attributes.reduce((comma, attr) => {
      this.writeStructAttributeReflection(wr, attr, comma);
      return ', ';
    }, '');
    this.wl.write(0, '\n');
    this.wl.writeLine(2, ']');
    this.wl.writeLine(1, '}));');
  }
  writeCreateFunction(wr: TSWriter) {
    this.wl.writeLine(1, 'export function create(args: Partial<Type> = {}): Type {');
    this.wl.writeLine(2, 'return {');
    this.def.attributes.forEach(i => {
      const adef = i.name;
      switch (i.type.type) {
        case Definition.Types.Boolean.type:
        case Definition.Types.Char.type:
        case Definition.Types.Uint8.type:
        case Definition.Types.Uint16.type:
        case Definition.Types.Short.type:
        case Definition.Types.Uint32.type:
        case Definition.Types.Int.type:
        case Definition.Types.Float.type:
        case Definition.Types.Double.type:
          this.wl.writeLine(
            3,
            `${adef}: typeof args.${adef} === '${typeDefinition(
              i.type,
            )}' ? args.${adef} : ${initialValue(wr, i.type)},`,
          );
          break;
        case Definition.Types.Uint64.type:
        case Definition.Types.Long.type:
          this.wl.writeLine(3, `${adef}: Runtime.HighLow.create(args.${adef}),`);
          break;
        case Definition.Types.Struct.type:
          const sdef = i.type as Definition.Types.Struct;
          this.wl.writeLine(3, `${adef}: ${sdef.name}.create(args.${adef})`);
          this.addTypeReference(wr, sdef);
          break;
        case Definition.Types.FixedArray.type:
        default:
          throw Error(`writeReflection failed for: ${i.type}`);
      }
    });
    this.wl.writeLine(2, '};');
    this.wl.writeLine(1, '}');
  }

  writeFromStream(wr: TSWriter) {
    this.wl.writeLine(
      1,
      'export function fromStream(rb: Runtime.StreamBuffer): Type {',
    );
    this.wl.writeLine(2, `return rb.prepareRead(${wr.quote(this.def.name)}, ${this.def.bytes}, (nrb) => ({`);
    this.def.attributes.forEach(i => {
      switch (Definition.Types.toAttributeType(i.type)) {
        case Definition.Types.AttributeType.Scalar:
          this.wl.writeLine(3, `${i.name}: nrb.read${i.type.type}(),`);
          break;
        case Definition.Types.AttributeType.Struct:
          const sdef = i.type as Definition.Types.Struct;
          this.wl.writeLine(3, `${i.name}: ${sdef.name}.fromStream(nrb.sbuf),`);
          break;
        case Definition.Types.AttributeType.FixedArray:
          throw Error('rotodoewfjrw');
          break;
      }
    });
    this.wl.writeLine(2, '}));');
    this.wl.writeLine(1, '}');
  }

  writeToStream(wr: TSWriter) {
    this.wl.writeLine(1, 'export function toStream(data: Partial<Type>,');
    this.wl.writeLine(2, 'wb: Runtime.StreamBuffer): Runtime.StreamBuffer {');
    this.wl.writeLine(2, `return wb.prepareWrite(${wr.quote(this.def.name)}, ${this.def.bytes}, (nwb) => {`);
    this.wl.writeLine(3, 'const tmp = create(data);');
    // this.wl.writeLine(3, 'console.log(tmp, data);');
    this.def.attributes.forEach(i => {
      switch (Definition.Types.toAttributeType(i.type)) {
        case Definition.Types.AttributeType.Scalar:
          this.wl.writeLine(3, `nwb.write${i.type.type}(tmp.${i.name});`);
          break;
        case Definition.Types.AttributeType.Struct:
          const sdef = i.type as Definition.Types.Struct;
          this.wl.writeLine(3, `${sdef.name}.toStream(tmp.${i.name}, nwb.sbuf);`);
          break;
        case Definition.Types.AttributeType.FixedArray:
          throw Error('rotodoewfjrw');
          break;
      }
    });
    this.wl.writeLine(2, '});');
    this.wl.writeLine(1, '}');
  }

  write(wr: TSWriter): TSStructWriter {
    if (this.written) {
      return this;
    }
    this.written = true;
    this.wl.writeLine(0, `export namespace ${this.def.name} {`);

    this.writeInterface(wr);
    this.writeReflection(wr);
    this.writeCreateFunction(wr);
    this.writeFromStream(wr);
    this.writeToStream(wr);

    this.wl.writeLine(0, '}');

    Array.from(this.imports.values())
      .filter(i => !(i.imp.sWriter && i.imp.sWriter.def == this.def))
      .reverse().forEach(i =>
      this.wl.prependLine(0, i.toString(wr))
    );
    this.wl.prependLine(0, `// generated ${this.def.name}`);
    // this.wl.writeLine(0, '');
    return this;
  }

  public toString() {
    return this.wl.toString();
  }
}

export interface TSImportArgs {
  readonly external?: {
    readonly fname: string;
    readonly def: string;
  }
  readonly sWriter?: TSStructWriter;
}

export class TSImport {
  constructor(public readonly imp: TSImportArgs) {
  }

  public get name() {
    if (this.imp.external) {
      return this.imp.external.def;
    } else {
      return this.imp.sWriter!.def.name;
    }
  }

  public toString(wr: TSWriter) {
    if (this.imp.external) {
    return `import { ${this.imp.external.def} } from ${wr.quote(this.imp.external.fname)};`;
    } else {
      return `import { ${this.imp.sWriter!.def.name} } from ${wr.quote(this.imp.sWriter!.fname)};`;
    }
  }
}

export interface TSWriterArgs {
  readonly runtimePath: string;
  readonly definitionPath: string;
  readonly generationPath: string;
  readonly quote: string;
}

export class TSWriter {
  readonly structs = new Map<string, TSStructWriter>();
  public args: TSWriterArgs;
  constructor(args: Partial<TSWriterArgs> = {}) {
    this.args = {
      ...args,
      quote: args!.quote || "'",
      generationPath: args!.generationPath || './',
      runtimePath: args!.runtimePath || "flatterbuf/runtime",
      definitionPath: args!.definitionPath || "flatterbuf/definition"
    };
  }

  public quote(val: string): string {
    return `${this.args.quote}${val.replace(new RegExp(this.args.quote, 'g'), `\\${this.args.quote}`)}${this.args.quote}`;
  }

  public structClass(def: Definition.Types.Struct, level: number) {
    let tsw = this.structs.get(def.name);
    if (!tsw) {
      tsw = new TSStructWriter(def, level, this.args);
      this.structs.set(tsw.def.name, tsw);
    }
    return tsw;
  }

  public generator(def: Definition.Types.Type): TSWriter {
    if (Definition.Types.isFixedArray(def)) {
      throw Error(`Implement-Array:${def.type}`);
    } else if (Definition.Types.isStruct(def)) {
      this.structClass(def as Definition.Types.Struct, 0);
      return this;
    } else if (Definition.Types.isScalar(def)) {
      throw Error(`Implement-Scalar:${def.type}`);
    }
    throw Error(`Unknown Type:${def.type}`);
  }

  // public getImports() {}

  public getStructs() {
    let ret: TSStructWriter[];
    let preSize = 0;
    do {
    // first pass
      preSize = this.structs.size;
      // console.log('getStruct-1=', preSize);
      ret = Array.from(this.structs.values())
      .map(i => {
        // console.log('>>>>>>>>1>', i.def.name);
        return i.write(this);
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

export function TSGenerator(def: Definition.Types.Type, writer = new TSWriter()): TSWriter {
  return writer.generator(def);
}
