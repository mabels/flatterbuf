import { Definition } from '../definition';
import { Type } from 'typescript';
import { Runtime } from '../runtime';
import { wrap } from 'module';
import { type } from 'os';

export class TSWriteLine {
  private readonly lines: string[] = [];

  public prependLine(i: number, line: string) {
    this.action(i, line + '\n', Array.prototype.unshift);
  }
  public prepend(i: number, line: string) {
    this.action(i, line, Array.prototype.unshift);
  }

  public writeLine(i: number, lines: string) {
    lines.split('\n').forEach(line => {
      this.write(i, line + '\n');
    });
  }
  public write(i: number, line: string) {
    this.action(i, line, Array.prototype.push);
  }
  public action(i: number, str: string, action: (s: string) => void) {
    action.apply(this.lines, [
      Array(i * 2)
        .fill(' ')
        .join('') + str,
    ]);
  }

  public toString() {
    return this.lines.join('');
  }
}

export class TSImport<T> {
  constructor(public readonly imp: TSImportArgs<T>) {}

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

export function typeDefinition<T>(t: Definition.Types.Type<T>): string {
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
      return 'Runtime.Types.HighLow.Type';
    case Definition.Types.Struct.type:
      return `${(t as unknown as Definition.Types.Struct).name}.Type`;
    case Definition.Types.FixedCString.type:
    case Definition.Types.FixedArray.type:
      return typeDefinition((t as unknown as Definition.Types.FixedArray<unknown>).element) + '[]';
    default:
      throw Error(`typeDefinition failed for: ${t.type}`);
  }
}

export function attributeDefinition(def: Definition.Types.StructBaseAttribute) {
  return def.name + (def.notRequired ? '?' : '');
}

function initialValue<T>(_wr: TSWriter, vname: string, def: Definition.Types.Type<T>): string {
  switch (def.type) {
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
    case Definition.Types.Uint64.type:
    case Definition.Types.Long.type:
      // const hl = (def as Definition.Types.ScalarType<Runtime.Types.HighLow.Type>).initial;
      // return `{ high: ${hl.high}, low: ${hl.low} }`;
    case Definition.Types.Struct.type:
    case Definition.Types.FixedArray.type:
    case Definition.Types.FixedCString.type:
      // return `Reflection.attributes[${wr.quote(sdef.name)}].initial`;
      return `${vname}`;
    default:
      throw Error(`initialValue failed for: ${vname} => ${def.type}`);
  }
}

export class TSStructWriter<T> {
  private readonly wl: TSWriteLine = new TSWriteLine();
  public readonly fname: string;

  private written: boolean = false; // SideEffect not moderated

  private readonly imports: Map<string, TSImport<T>> = new Map();

  constructor(
    public readonly def: Definition.Types.Struct,
    public readonly level: number,
    public readonly args: TSWriterArgs,
  ) {
    const defintion = new TSImport({
      external: {
        def: 'Definition',
        fname: args.definitionPath || 'flatterbuf/definition',
      },
    });
    this.imports.set(defintion.name, defintion);
    const runtime = new TSImport({
      external: {
        def: 'Runtime',
        fname: args.runtimePath || 'flatterbuf/runtime',
      },
    });
    this.imports.set(runtime.name, runtime);
    this.fname = `${args.generationPath}${this.def.name.toLowerCase()}`;
  }

  public writeStructAttributeReflection<B>(
    wr: TSWriter,
    attr: Definition.Types.StructAttributeOfs<B>,
    comma: string,
    ident = 2,
    wl = this.wl,
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

  public alignFuncs(wr: TSWriter, alignFuncs: Definition.Align.Funcs<string>) {
    return `{ element: ${wr.quote(alignFuncs.element)}, overall: ${wr.quote(alignFuncs.overall)} }`;
  }

  public arrayInitial<B>(wr: TSWriter, length: number, vals: B[]): string {
    return vals.slice(0, length).map(i => {
      switch (typeof i) {
        case 'number': return `${i}`;
        case 'string': return `${wr.quote(i)}`;
        case 'object': return JSON.stringify(i);
        default: return `[]`;
      }
    }).join(', ');
  }

  public getTypeDefinition<B>(ident: number, wr: TSWriter, attr: Definition.Types.Type<B>): string {
    const wl = new TSWriteLine();
    switch (attr.type) {
      case Definition.Types.Boolean.type:
        wl.writeLine(0, `new Definition.Types.Boolean({`);
        wl.writeLine(
          ident + 2,
          `initial: ${!!(attr.initial)}`,
        );
        wl.write(ident + 1, `})`);
        break;
      case Definition.Types.Char.type:
      case Definition.Types.Uint8.type:
      case Definition.Types.Uint16.type:
      case Definition.Types.Short.type:
      case Definition.Types.Uint32.type:
      case Definition.Types.Int.type:
      case Definition.Types.Float.type:
      case Definition.Types.Double.type:
        wl.writeLine(0, `new Definition.Types.${attr.type}({`);
        wl.writeLine(
          ident + 2,
          `initial: ${attr.initial}`,
        );
        wl.write(ident + 1, `})`);
        break;
      case Definition.Types.Uint64.type:
      case Definition.Types.Long.type:
        {
          const val = { high: 0, low: 0 };
          const sdef = (attr as unknown as Definition.Types.Type<Runtime.Types.HighLow.Type>).initial;
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
        {
          const sdef = attr as Definition.Types.TypeNameAttribute<B>;
          this.addTypeReference(wr, sdef);
          wl.writeLine(ident + 1, `${sdef.name}.Reflection.prop`);
        }
        break;
      case Definition.Types.FixedCString.type:
      case Definition.Types.FixedArray.type:
        const adef = attr as unknown as Definition.Types.FixedArray<B>;
        wl.writeLine(0, `new Definition.Types.${attr.type}({`);
        wl.writeLine(ident + 2, `length: ${adef.length},`);
        wl.writeLine(ident + 2, `alignFuncs: ${this.alignFuncs(wr, adef.alignFuncs)},`);
        if (attr.type !== Definition.Types.FixedCString.type) {
          wl.writeLine(ident + 2, `element: ${this.getTypeDefinition(ident + 3, wr, adef.element)},`);
        }
        if (adef.initial != undefined) {
          wl.writeLine(ident + 2, `initial: [${this.arrayInitial(wr, adef.length, adef.initial)}]`);
        }
        /*
        if (attr.type === Definition.Types.FixedCString.type) {
          const scdef = attr as unknown as Definition.Types.FixedCString;
          if (Array.isArray(scdef.initial)) {
            const tmp = scdef.initial.map(i => {
              if (typeof i.initial === 'number') {
                return i.initial;
              }
              if (typeof i.initial === 'string') {
                return wr.quote(i.initial);
              }
              return 0;
            }).join(', ');
            wl.writeLine(ident + 2, `initial: [${tmp}]`);
          }
        } else {
        }
        */
        wl.write(ident + 1, `})`);
        break;
      default:
        throw Error(`getTypeDefinition failed for: ${attr.type}`);
    }
    return wl.toString();
  }

  public addTypeReference<T>(wr: TSWriter, def: Definition.Types.Type<T>) {
    if (Definition.Types.isScalar(def)) {
      return;
    }
    if (Definition.Types.isFixedArray(def)) {
      const adef = def as unknown as Definition.Types.ArrayTypeAttribute<T>;
      this.addTypeReference(wr, adef.element);
      return;
    }
    if (Definition.Types.isStruct(def)) {
      const sdef = def as unknown as Definition.Types.Struct;
      const tsw = wr.structClass(sdef, this.level + 1);
      const m = new TSImport({ sWriter: tsw });
      // console.log('addTypeReference of ', this.fname, sdef.name, m.name);
      this.imports.set(m.name, m);
      return;
    }
    throw Error(`addTypeReferenced for unknown type:${def.type}`);
  }

  public writeInterface(wr: TSWriter) {
    this.wl.writeLine(1, `export interface Type {`);
    this.def.attributes.forEach(i => {
      this.addTypeReference(wr, i.type);
      this.wl.writeLine(2, `readonly ${attributeDefinition(i)}: ${typeDefinition(i.type)};`);
    });
    this.wl.writeLine(1, '}');
  }

  public writeReflection(wr: TSWriter) {
    this.wl.writeLine(
      1,
      `export const Reflection = new Runtime.Reflection<Type>(new Definition.Types.Struct({`,
    );
    this.wl.writeLine(2, `name: ${wr.quote(this.def.name)},`);
    const sdef = this.def as Definition.Types.Struct;
    this.wl.writeLine(2, `alignFuncs: ${this.alignFuncs(wr, sdef.alignFuncs)},`);
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

  public createType<B>({level, wr, aname, vname, def}: {
    level: number,
    wr: TSWriter,
    aname: string,
    vname: string,
    def: Definition.Types.Type<B>
  }): string {
    switch (def.type) {
      case Definition.Types.Char.type:
        // return `Runtime.Types.Char.create(${aname}, ${initialValue(wr, vname, def)})`;
      case Definition.Types.Boolean.type:
      case Definition.Types.Uint8.type:
      case Definition.Types.Uint16.type:
      case Definition.Types.Short.type:
      case Definition.Types.Uint32.type:
      case Definition.Types.Int.type:
      case Definition.Types.Float.type:
      case Definition.Types.Double.type:
        return `Runtime.Types.${def.type}.create(...args.map(i => i.${vname}))`;
        /*
        return `typeof ${aname} === ${wr.quote(typeDefinition(def))} ? ${aname} : ${initialValue(
          wr,
          vname,
          def
        )}`;
        */
      case Definition.Types.Uint64.type:
      case Definition.Types.Long.type:
        return `Runtime.Types.HighLow.create(${aname}, ${initialValue(wr, vname, def)})`;
      case Definition.Types.Struct.type:
        const sdef = def as Definition.Types.TypeNameAttribute<B>;
        return `${sdef.name}.create(${aname}, ${vname})`;
      case Definition.Types.FixedCString.type:
        const scdef = def as unknown as Definition.Types.FixedCString;
        return `Runtime.Types.${def.type}.create(${
          scdef.length
        }, ${aname}, ${initialValue(wr, vname, def)})`;
      case Definition.Types.FixedArray.type:
        const adef = def as unknown as Definition.Types.ArrayTypeAttribute<B>;
        return `Runtime.Types.${def.type}.create(${
          adef.length
        }, (idx${level}) => ${this.createType({
          level: level + 1,
          wr,
          aname: `(${aname} || ${initialValue(wr, vname, def)})[idx${level}]`,
          vname: 'YYYY',
          def: adef.element
          })})`;
      default:
        throw Error(`writeReflection failed for: ${type}`);
    }
  }

  public getArrayLengths<B>(def: Definition.Types.Type<B>, ret = ''): string {
    if (def.type === Definition.Types.FixedArray.type) {
      if (ret.length) {
        ret += ', ';
      }
      const adef = def as unknown as Definition.Types.ArrayTypeAttribute<B>;
      ret += `${adef.length}`;
      return this.getArrayLengths(adef.element, ret);
    }
    return ret;
  }

  public writeCreateAttribute<B>(level: number, attr: Definition.Types.Type<B>, vname: string): string {
    switch (Definition.Types.toAttributeType(attr)) {
      case Definition.Types.AttributeType.Scalar:
        return `Runtime.Types.${attr.type}.create(${vname})`;
      case Definition.Types.AttributeType.FixedArray:
        const adef = attr as unknown as Definition.Types.ArrayTypeAttribute<B>;
        if (adef.type === Definition.Types.FixedCString.type) {
          return `Runtime.Types.${attr.type}.create(${adef.length}, ${vname})`;
        } else {
          return `Runtime.Types.${attr.type}.create([${this.getArrayLengths(adef)}], ${vname})`;
        }
      case Definition.Types.AttributeType.Struct:
        const sdef = attr as unknown as Definition.Types.Struct;
        return `${sdef.name}.create(${vname})`;
    }
    // switch (Definition.Types.toAttributeType(attr)) {
    //   case Definition.Types.AttributeType.Scalar:
    //   case Definition.Types.AttributeType.Struct:
    //     return `...${vname}`;
    //   case Definition.Types.AttributeType.FixedArray:
    //     const adef = attr as unknown as Definition.Types.ArrayTypeAttribute<B>;
    //     // Array(3).fill(undefined).map((_, idx0) => Runtime.Types.FixedArray.create(4, ...data.Nested[idx0]))
    //     return `Array(${adef.length}).fill(undefined).map((_, idx${level}) => Runtime.Types.FixedArray.create(${adef.length}, ${this.nestedArrayCreateFunction(level + 1, adef.element, `vname[idx${level}]`)})`;

    //     // Runtime.Types.${def.type}.create(${adef.length}, ${this.nestedArrayCreateFunction(adef.element, vname)})`;
    // }

    // const adef = attr.type as Definition.Types.ArrayTypeAttribute<unknown>;
    //       if (Definition.Types.toAttributeType(adef.element) !== Definition.Types.AttributeType.FixedArray) {
    //         this.wl.writeLine(3, `${attr.name}: Runtime.Types.${attr.type.type}.create(${adef.length}, ...data.${attr.name}),`);
    //       } else {
    //         this.wl.writeLine(3, `${attr.name}: [`);
    //         for (let a = 0; a < adef.length; ++a) {
    //           this.wl.writeLine(4, `data.${attr.name}[${a}],`);
    //         }
    //         this.wl.writeLine(3, `],`);
    //       }
    //       // Runtime.Types.${adef.type}.create(${adef.length}, ${this.nestedArrayCreateFunction(0, adef.element, `data.${attr.name}`)}),`);
    //       break;
  }

  public emptyNestedArray<B>(type: Definition.Types.Type<B>): string {
    switch (Definition.Types.toAttributeType(type)) {
      case Definition.Types.AttributeType.FixedArray:
        const adef = type as unknown as Definition.Types.ArrayTypeAttribute<B>;
        if (Definition.Types.toAttributeType(adef.element) !== Definition.Types.AttributeType.FixedArray) {
          return '[]';
        }
        return `[ ${Array(adef.length).fill(0).map((_, i) => this.emptyNestedArray(adef.element)).join(', ')} ]`;
      case Definition.Types.AttributeType.Scalar:
      case Definition.Types.AttributeType.Struct:
        return '[]';
    }
  }

  public writeCreateFunction(wr: TSWriter) {
    this.wl.writeLine(1, 'export function create(...rargs: Partial<Type>[]): Type {');
    this.wl.writeLine(2, `const data = rargs.filter(i => typeof i === 'object').concat(Reflection.initial).reduce((r, i) => {`);
    this.def.attributes.forEach(i => {
      this.wl.writeLine(3, `if (i.${i.name} !== undefined) {`);
      this.wl.writeLine(4, `r.${i.name}.push(i.${i.name});`);
      this.wl.writeLine(3, `}`);
    });
    this.wl.writeLine(3, 'return r;');
    this.wl.writeLine(2, `}, {`);
    this.def.attributes.forEach(i => {
      this.wl.writeLine(3, `${i.name}: ${this.emptyNestedArray(i.type)} as ${typeDefinition(i.type)}[],`);
      if (Definition.Types.isStruct(i.type)) {
        this.addTypeReference(wr, i.type);
      }
    });
    this.wl.writeLine(2, '});');
    this.wl.writeLine(2, `return {`);
    this.def.attributes.forEach(attr => {
      this.wl.writeLine(3, `${attr.name}: ${this.writeCreateAttribute(0, attr.type, `...data.${attr.name}`)},`);
    });
    this.wl.writeLine(2, `};`);
    this.wl.writeLine(1, '}');
  }

  public fromStreamAction<B>(level: number, wr: TSWriter, def: Definition.Types.Type<B>): string {
    switch (Definition.Types.toAttributeType(def)) {
      case Definition.Types.AttributeType.Scalar:
        return `nrb.read${def.type}()`;
      case Definition.Types.AttributeType.Struct:
        const sdef = def as Definition.Types.TypeNameAttribute<B>;
        return `${sdef.name}.fromStream(nrb.sbuf)`;
      case Definition.Types.AttributeType.FixedArray:
        const adef = def as unknown as Definition.Types.ArrayTypeAttribute<B>;
        return `Runtime.Types.${def.type}.fromStream(${
          adef.length
        }, (idx${level}) => ${this.fromStreamAction(level + 1, wr, adef.element)})`;
    }
    // throw Error(`fromStreamAction: ${type.type}`);
  }

  public writeFromStream(wr: TSWriter) {
    this.wl.writeLine(1, 'export function fromStream(rb: Runtime.StreamBuffer): Type {');
    this.wl.writeLine(
      2,
      `return rb.prepareRead(${wr.quote(this.def.name)}, ${this.def.bytes}, (nrb) => ({`,
    );
    this.def.attributes.forEach(i => {
      this.wl.writeLine(3, `${i.name}: ${this.fromStreamAction(0, wr, i.type)},`);
    });
    this.wl.writeLine(2, '}));');
    this.wl.writeLine(1, '}');
  }

  public toStreamAction<B>(
    level: number,
    wr: TSWriter,
    aname: string,
    def: Definition.Types.Type<B>,
  ): string {
    switch (Definition.Types.toAttributeType(def)) {
      case Definition.Types.AttributeType.Scalar:
        return `nwb.write${def.type}(${aname})`;
      case Definition.Types.AttributeType.Struct:
        const sdef = def as Definition.Types.TypeNameAttribute<B>;
        return `${sdef.name}.toStream(${aname}, nwb.sbuf)`;
        break;
      case Definition.Types.AttributeType.FixedArray:
        const adef = def as unknown as Definition.Types.ArrayTypeAttribute<B>;
        return `Runtime.Types.${def.type}.toStream(${
          adef.length
        }, (idx${level}) => ${this.toStreamAction(
          level + 1,
          wr,
          `(${aname} || [])[idx${level}]`,
          adef.element,
        )})`;
    }
  }

  public writeToStream(wr: TSWriter) {
    this.wl.writeLine(1, 'export function toStream(data: Partial<Type>,');
    this.wl.writeLine(2, 'wb: Runtime.StreamBuffer): Runtime.StreamBuffer {');
    this.wl.writeLine(
      2,
      `return wb.prepareWrite(${wr.quote(this.def.name)}, ${this.def.bytes}, (nwb) => {`,
    );
    this.wl.writeLine(3, 'const tmp = create(data);');
    this.def.attributes.forEach(i => {
      this.wl.writeLine(3, this.toStreamAction(0, wr, `tmp.${i.name}`, i.type) + ';');
    });
    this.wl.writeLine(2, '});');
    this.wl.writeLine(1, '}');
  }

  public write(wr: TSWriter): TSStructWriter<T> {
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
      .reverse()
      .forEach(i => this.wl.prependLine(0, i.toString(wr)));
    this.wl.prependLine(0, `// generated ${this.def.name}`);
    // this.wl.writeLine(0, '');
    return this;
  }

  public toString() {
    return this.wl.toString();
  }
}

export interface TSImportArgs<T> {
  readonly external?: {
    readonly fname: string;
    readonly def: string;
  };
  readonly sWriter?: TSStructWriter<T>;
}

export interface TSWriterArgs {
  readonly runtimePath: string;
  readonly definitionPath: string;
  readonly generationPath: string;
  readonly quote: string;
}

export class TSWriter {
  public readonly structs: Map<string, TSStructWriter<unknown>> = new Map();
  public args: TSWriterArgs;
  constructor(args: Partial<TSWriterArgs> = {}) {
    this.args = {
      ...args,
      quote: args!.quote || "'",
      generationPath: args!.generationPath || './',
      runtimePath: args!.runtimePath || 'flatterbuf/runtime',
      definitionPath: args!.definitionPath || 'flatterbuf/definition',
    };
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
      tsw = new TSStructWriter(def, level, this.args);
      this.structs.set(tsw.def.name, tsw);
    }
    return tsw;
  }

  public generator<T>(def: Definition.Types.Type<T>): TSWriter {
    if (Definition.Types.isFixedArray(def)) {
      throw Error(`Implement-Array:${def.type}`);
    } else if (Definition.Types.isStruct(def)) {
      this.structClass(def as unknown as Definition.Types.Struct, 0);
      return this;
    } else if (Definition.Types.isScalar(def)) {
      throw Error(`Implement-Scalar:${def.type}`);
    }
    throw Error(`Unknown Type:${def.type}`);
  }

  // public getImports() {}

  public getStructs() {
    let ret: TSStructWriter<unknown>[];
    let preSize = 0;
    do {
      // first pass
      preSize = this.structs.size;
      // console.log('getStruct-1=', preSize);
      ret = Array.from(this.structs.values()).map(i => {
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

export function TSGenerator<T>(def: Definition.Types.Type<T>, writer = new TSWriter()): TSWriter {
  return writer.generator(def);
}
