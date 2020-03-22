import { Definition } from '../definition';
import { Type } from 'typescript';
import { Runtime } from '../runtime';

export class TSWriteLine {
  readonly lines: string[] = [];

  public writeLine(i: number, line: string) {
    this.lines.push(
      Array(i * 2)
        .fill(' ')
        .join('') + line,
    );
  }

  public toString() {
    return this.lines.join('\n');
  }
}

export function typeDefinition(t: Definition.Types.Type): string {
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
      return 'Runtime.HighLow';
    case Definition.Types.Struct.type:
      return (t as Definition.Types.Struct).name;
    case Definition.Types.FixedArray.type:
      return typeDefinition((t as Definition.Types.FixedArray).element) + '[]';
    default:
      throw Error(`Scalar2Ts failed for: ${t.type}`);
  }
}

export function attributeDefinition(def: Definition.Types.Type) {
  return def.type + (def.require ? '?' : '');
}

export function scalar2default(t: Definition.Types.ScalarType<unknown>) {
  switch (t.type) {
    case Definition.Types.Boolean.type:
      return t.initial ? 'true' : 'false';
    case Definition.Types.Char.type:
    case Definition.Types.Uint8.type:
    case Definition.Types.Uint16.type:
    case Definition.Types.Short.type:
    case Definition.Types.Uint32.type:
    case Definition.Types.Int.type:
    case Definition.Types.Float.type:
    case Definition.Types.Double.type:
      return '' + ~~t.initial;
    case Definition.Types.Uint64.type:
    case Definition.Types.Long.type:
      return JSON.stringify({ high: 47, low: 11 });
    default:
      throw Error(`Scalar2Ts failed for: ${t.type}`);
  }
}

export function getReflection(
  ident: number,
  ofs: number,
  def: Definition.Types.Type,
  wl: TSWriteLine,
  name?: string,
): number {
  wl.writeLine(ident, `{`);
  if (name) {
    wl.writeLine(ident + 1, `name: "${name}",`);
  }
  wl.writeLine(ident + 1, `ofs: ${ofs},`);
  wl.writeLine(ident + 1, `type: "${def.type}",`);
  wl.writeLine(ident + 1, `bytes: ${def.bytes},`);
  wl.writeLine(ident + 1, `notRequired: ${def.require},`);
  switch (def.type) {
    case Definition.Types.Boolean.type:
      wl.writeLine(ident + 1, `initial: ${(def as Definition.Types.ScalarType<boolean>).initial}`);
      break;
    case Definition.Types.Char.type:
    case Definition.Types.Uint8.type:
    case Definition.Types.Uint16.type:
    case Definition.Types.Short.type:
    case Definition.Types.Uint32.type:
    case Definition.Types.Int.type:
    case Definition.Types.Float.type:
    case Definition.Types.Double.type:
      wl.writeLine(ident + 1, `initial: ${(def as Definition.Types.ScalarType<number>).initial}`);
      break;
    case Definition.Types.Uint64.type:
    case Definition.Types.Long.type:
      {
        const val = { high: 0, low: 0 };
        const sdef = (def as Definition.Types.ScalarType<Runtime.HighLow.Type>).initial;
        if (sdef && typeof sdef.high) {
          val.high = sdef.high;
        }
        if (sdef && typeof sdef.low) {
          val.low = sdef.low;
        }
        wl.writeLine(ident + 1, `initial: ${JSON.stringify(val)}`);
      }
      break;
    case Definition.Types.Struct.type:
      const sdef = def as Definition.Types.Struct;
      wl.writeLine(ident + 1, `attributes: [`);
      sdef.attributes.reduce((p, i) => {
        return getReflection(ident + 2, p, i.type, wl, i.name);
      }, ofs);
      wl.writeLine(ident + 1, `]`);
      break;
    case Definition.Types.FixedArray.type:
      const adef = def as Definition.Types.FixedArray;
      wl.writeLine(ident + 1, `length: "${sdef.name}",`);
      wl.writeLine(ident + 1, `element: {`);
      getReflection(ident + 1, ofs, adef.element, wl);
      wl.writeLine(ident + 1, `}`);
      break;
    default:
      throw Error(`Scalar2Ts failed for: ${def.type}`);
  }
  wl.writeLine(ident, `},`);
  return ofs + def.bytes;
}

function initialValue(def: Definition.Types.Type) {
  switch (def.type) {
    case Definition.Types.Boolean.type:
      return (def as Definition.Types.ScalarType<boolean>).initial.toString();
      break;
    case Definition.Types.Char.type:
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
      return JSON.stringify((def as Definition.Types.ScalarType<Runtime.HighLow.Type>).initial);
    case Definition.Types.Struct.type:
    case Definition.Types.FixedArray.type:
    default:
      throw Error(`Scalar2Ts failed for: ${def.type}`);
  }
}

export class TSStructWriter {
  readonly wl = new TSWriteLine();

  constructor(private def: Definition.Types.Struct) {}

  writeInterface(wr: TSWriter) {
    this.wl.writeLine(1, `export interface Type {`);
    this.def.attributes.forEach(i => {
      wr.addTypeReference(i.type);
      this.wl.writeLine(2, `readonly ${attributeDefinition(i.type)}: ${typeDefinition(i.type)};`);
    });
    this.wl.writeLine(1, '}');
  }

  writeReflection(wr: TSWriter) {
    this.wl.writeLine(1, `export const Reflection = new Runtime.Reflection(`);
    getReflection(2, 0, this.def, this.wl, this.def.name);
    this.wl.writeLine(1, ');');
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
            )}' ? args.${adef} : ${initialValue(i.type)},`,
          );
          break;
        case Definition.Types.Uint64.type:
        case Definition.Types.Long.type:
          this.wl.writeLine(
            3,
            `${adef}: Runtime.HighLow.create(args.${adef}),`
          );
          break;
        case Definition.Types.Struct.type:
        case Definition.Types.FixedArray.type:
        default:
          throw Error(`Scalar2Ts failed for: ${i.type}`);

      }
    });
    this.wl.writeLine(2, '}');
    this.wl.writeLine(1, '}');
  }

  writeFromStream() {
    this.wl.writeLine(
      1,
      'export async function fromStream(rb: Runtime.ReadStreamBuffer): Promise<Type> {',
    );
    this.wl.writeLine(2, `return rb.prepareRead("${this.def.name}", ${this.def.bytes}, (rb) => ({`);
    this.def.attributes.forEach(i => {
      this.wl.writeLine(3, `${i.name}: rb.read${i.type.type}(),`);
    });
    this.wl.writeLine(2, '}));');
    this.wl.writeLine(1, '}');
  }

  writeToStream() {
    this.wl.writeLine(
      1,
      'export async function toStream(data: Partial<Type>, wb: Runtime.StreamBuffer): Promise<Runtime.StreamBuffer>  {',
    );
    this.wl.writeLine(2, `return wb.prepareWrite("${this.def.name}", ${this.def.bytes}, (wb) => {`);
    this.wl.writeLine(3, 'const tmp = create(data);');
    // this.wl.writeLine(3, 'console.log(tmp, data);');
    this.def.attributes.forEach(i => {
      const adef = attributeDefinition(i.type);
      this.wl.writeLine(3, `wb.write${i.type.type}(tmp.${i.name});`);
    });
    this.wl.writeLine(2, '});');
    this.wl.writeLine(1, '}');
  }

  write(wr: TSWriter): TSStructWriter {
    this.wl.writeLine(0, `export namespace ${this.def.name} {`);

    this.writeInterface(wr);
    this.writeReflection(wr);
    this.writeFromStream();
    this.writeToStream();

    this.wl.writeLine(0, '}');
    return this;
  }

  public toString() {
    return this.wl.toString();
  }
}

export class TSImport {
  constructor(public readonly name: string, public readonly fname = name.toLowerCase()) {}
  public toString() {
    return `import { ${this.name} } from '${this.fname}';`;
  }
}

export interface TSWriterArgs {
  readonly runtimePath?: string;
}

export class TSWriter {
  readonly structs: TSStructWriter[] = [];

  readonly imports = new Map<string, TSImport>();

  constructor(args: TSWriterArgs = {}) {
    const runtime = new TSImport('Runtime', args.runtimePath || 'flatterbuf/runtime');
    this.imports.set(runtime.name, runtime);
  }

  public addTypeReference(def: Definition.Types.Type) {
    if (Definition.Types.isScalar(def)) {
      return;
    }
    if (Definition.Types.isFixedArray(def)) {
      const adef = def as Definition.Types.FixedArray;
      const m = new TSImport(adef.element.type);
      this.imports.set(m.name, m);
    }
    if (Definition.Types.isStruct(def)) {
      const sdef = def as Definition.Types.Struct;
      const m = new TSImport(sdef.name);
      this.imports.set(m.name, m);
      return;
    }
    throw Error(`addTypeReferenced for unknown type:${def.type}`);
  }

  public structClass(def: Definition.Types.Struct) {
    this.structs.push(new TSStructWriter(def));
  }

  public generator(def: Definition.Types.Type): TSWriter {
    if (Definition.Types.isFixedArray(def)) {
      throw Error(`Implement-Array:${def.type}`);
    } else if (Definition.Types.isStruct(def)) {
      this.structClass(def as Definition.Types.Struct);
      return this;
    } else if (Definition.Types.isScalar(def)) {
      throw Error(`Implement-Scalar:${def.type}`);
    }
    throw Error(`Unknown Type:${def.type}`);
  }

  public getImports() {
    return Array.from(this.imports.values())
      .map(i => i.toString())
      .join('\n');
  }

  public getStructs() {
    return Array.from(this.structs.values())
      .map(i => i.write(this).toString())
      .join('\n');
  }
  public getTs() {
    return [this.getImports(), this.getStructs()].join('\n');
  }
}

export function TSGenerator(def: Definition.Types.Type, writer = new TSWriter()): TSWriter {
  return writer.generator(def);
}
