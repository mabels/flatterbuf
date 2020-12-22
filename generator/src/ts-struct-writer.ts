import { Types, Align, Optional } from 'flatterbuf';
// import { Runtime } from '../runtime';
import {
  TSWriteLine,
  TSWriterArgs,
  TSWriter,
  attributeDefinition,
  typeDefinition,
  TSRefWriter,
  tsStringify,
} from './ts';
import { TSImports, TSImport } from './ts-imports';

export class TSStructWriter implements TSRefWriter {
  public readonly fname: string;
  private readonly imports: TSImports;
  constructor(
    public readonly def: Types.Struct.Definition,
    public readonly level: number,
    public readonly args: TSWriterArgs,
  ) {
    this.imports = new TSImports(args);
    this.fname = `${args.generationPath}${this.def.name.toLowerCase()}`;
  }
  private writeStructAttribute<B>(wr: TSWriter, attr: Types.Struct.AttributeOfs<B>) {
    const wl = new TSWriteLine(wr);
    wl.writeLine(0, `{`);
    wl.writeLine(1, `name: ${wl.wr.quote(attr.name)},`);
    wl.writeLine(1, `ofs: ${attr.ofs},`);
    let initial: Optional.Option<unknown> = Optional.NoneOption;
    if (Optional.isSome(this.def.givenInitial)) {
      initial = Optional.SomeOption(this.def.givenInitial.some[attr.name]);
    }
    wl.writeLine(1, `type: ${this.getTypeDefinition(wl.wr, attr.name, attr.type, initial)}`);
    wl.write(0, `}`);
    return wl.toString();
  }
  private alignFuncs(wr: TSWriter, alignFuncs: Align.Funcs<string>) {
    return `{ element: ${wr.quote(alignFuncs.element)}, overall: ${wr.quote(alignFuncs.overall)} }`;
  }
  private arrayInitial<B>(wr: TSWriter, length: number, vals: B[]): string {
    return vals
      .slice(0, length)
      .map((i) => {
        switch (typeof i) {
        case 'number':
          return `${i}`;
        case 'string':
          return `${wr.quote(i)}`;
        case 'object':
          return JSON.stringify(i);
        default:
          return `[]`;
        }
      })
      .join(', ');
  }

  private initialArg<B>(
    wr: TSWriter,
    tdef: Types.Base.Definition<B>,
    _initial: Optional.Option<B>,
  ): string {
    const wl = new TSWriteLine(wr);
    if (Optional.isSome(tdef.givenInitial)) {
      wl.writeLine(0, '{');
      wl.writeLine(1, `initial: ${JSON.stringify(tdef.givenInitial.some)}`);
      wl.write(0, '}');
    }
    return wl.toString();
  }

  private writeArrayDefinition<B>(wr: TSWriter, tdef: Types.Base.Definition<B>): string {
    const adef = (tdef as unknown) as Types.FixedArray.Definition<B>;
    // let valueType = '';
    if (Types.isFixedArray(tdef)) {
      // if (Types.isFixedArray(adef.element)) {
      //   valueType = adef.element.type;
      // } else {
      //   valueType = adef.element.type;
      // }
      const tsArray = `Types.${adef.type}.Definition`;
      return tsArray;
    }
    return `Types.${tdef.type}.Definition`;
  }

  private getTypeDefinition<B>(
    wr: TSWriter,
    attrName: string,
    tdef: Types.Base.Definition<B>,
    initial: Optional.Option<B>,
  ): string {
    const wl = new TSWriteLine(wr);
    switch (tdef.type) {
    case Types.Boolean.Definition.type:
      wl.writeLine(0, `new Types.Boolean.Definition(${this.initialArg(wr, tdef, initial)})`);
      break;
    case Types.Char.Definition.type:
    case Types.Uint8.Definition.type:
    case Types.Uint16.Definition.type:
    case Types.Short.Definition.type:
    case Types.Uint32.Definition.type:
    case Types.Int.Definition.type:
    case Types.Float.Definition.type:
    case Types.Double.Definition.type:
      wl.writeLine(0, `new Types.${tdef.type}.Definition(${this.initialArg(wr, tdef, initial)})`);
      break;
    case Types.Uint64.Definition.type:
    case Types.Long.Definition.type:
      wl.writeLine(0, `new Types.${tdef.type}.Definition(${this.initialArg(wr, tdef, initial)})`);
      break;
    case Types.BitStruct.Definition.type:
      const bdef = (tdef as unknown) as Types.BitStruct.Definition;
      this.addTypeReference(wr, bdef);
      wl.writeLine(0, `new ${bdef.name}.Definition(${this.initialArg(wr, tdef, initial)})`);

      break;
    case Types.Struct.Definition.type:
      const sdef = tdef as Types.Base.NamedType<B>;
      this.addTypeReference(wr, sdef);
      wl.write(1, `new ${sdef.name}.Definition()`);
      break;
    case Types.FixedArray.Definition.type:
    case Types.FixedCString.Definition.type:
      const adef = (tdef as unknown) as Types.FixedArray.Definition<B>;

      const typeName = this.writeArrayDefinition(wr, tdef);
      wl.writeLine(0, `new ${typeName}({`);
      wl.writeLine(1, `length: ${adef.length},`);
      wl.writeLine(1, `alignFuncs: ${this.alignFuncs(wr, adef.alignFuncs)},`);
      if (tdef.type !== Types.FixedCString.Definition.type) {
        wl.writeLine(
          1,
          `element: ${this.getTypeDefinition(
            wr,
            `Item.${attrName || tdef.type}`,
            adef.element,
            Optional.NoneOption,
          )},`,
        );
      }
      if (Optional.isSome(adef.givenInitial)) {
        wl.writeLine(
          1,
          `initial: [${this.arrayInitial(wr, adef.length, adef.givenInitial.some)}]`,
        );
      }
      wl.write(0, `})`);
      break;
    default:
      throw Error(`getTypeDefinition failed for: ${tdef.type}`);
    }
    return wl.toString();
  }

  private addTypeReference<B>(wr: TSWriter, def: Types.Base.Definition<B>) {
    if (Types.isScalar(def)) {
      if (def.type === Types.BitStruct.Definition.type) {
        const bdef = (def as unknown) as Types.BitStruct.Definition;
        const tsw = wr.bitStructClass(bdef, this.level + 1);
        this.imports.add(new TSImport({ sWriter: tsw.writer }));
      }
      return;
    }
    if (Types.isFixedArray(def)) {
      const adef = (def as unknown) as Types.FixedArray.ArrayTypeAttribute<B>;
      this.addTypeReference(wr, adef.element);
      return;
    }
    if (Types.isStruct(def)) {
      const sdef = (def as unknown) as Types.Struct.Definition;
      const tsw = wr.structClass(sdef, this.level + 1);
      this.imports.add(new TSImport({ sWriter: tsw.writer }));
      return;
    }
    throw Error(`addTypeReferenced for unknown type:${def.type}`);
  }
  public writeInterface(wl: TSWriteLine) {
    [{
      prefix: '',
      optional: '',
    }, {
      prefix: 'Partial',
      optional: '?',
    }].forEach((j) => {
      wl.writeLine(1, `export interface ${j.prefix}MutableType {`);
      const sdef = this.def as Types.Struct.Definition;
      sdef.attributes.forEach((i) => {
        this.addTypeReference(wl.wr, i.type);
        wl.writeLine(2, `${attributeDefinition(i)}${j.optional}: ${typeDefinition(i.type, `${j.prefix}MutableType`)};`);
      });
      wl.writeLine(1, '}');
      wl.writeLine(1, `export interface ${j.prefix}Type {`);
      sdef.attributes.forEach((i) => {
        this.addTypeReference(wl.wr, i.type);
        wl.writeLine(2, `readonly ${attributeDefinition(i)}${j.optional}: ` +
          `${typeDefinition(i.type, `${j.prefix}Type`)};`);
      });
      wl.writeLine(1, '}');
    });

    wl.writeLine(1, 'export type ValueType = Type;');
    // wl.writeLine(1, 'export type FromStreamFN  = (rb: StreamBuffer, name?: string) => Type;');
  }

  public writeTSObjectItem(wr: TSWriter, v: any): string {
    if (Array.isArray(v)) {
      return [`[\n`, ...v.map((i) => this.writeTSObjectItem(wr, i)), `\n],`].join('');
    } else if (typeof v === 'object') {
      return this.writeTSObject(wr, v);
    } else if (typeof v === 'string') {
      return wr.quote(v) + ',';
    }
    return v.toString() + ',';
  }
  private writeTSObject(wr: TSWriter, hl: { [id: string]: any }): string {
    const mid = Array.from(Object.entries(hl))
      .filter((v) => v[1] !== undefined)
      .map((v) => this.writeTSObjectItem(wr, v[1]));
    return [`{\n`, ...mid, `\n},`].join('');
  }

  private writeAttributes(wr: TSWriter) {
    const wl = new TSWriteLine(wr);
    wl.writeLine(0, '// tslint:disable-next-line: typedef');
    wl.writeLine(0, `public static readonly AttributeByName = {`);
    this.def.attributes.forEach((attr) => {
      wl.writeLine(1, `${attr.name}: ${this.writeStructAttribute(wl.wr, attr)},`);
    });
    wl.writeLine(0, `};\n`);
    wl.writeLine(0, `public static readonly Attributes: Types.Struct.AttributeOfs<unknown>[] = [`);
    this.def.attributes.forEach((attr) => {
      wl.writeLine(1, `Definition.AttributeByName.${attr.name},`);
    });
    wl.writeLine(0, '];');
    wl.writeLine(0, this.writeStaticGivenInitial(wl.wr));
    return wl.toString();
  }

  private writeFilterFunction(wr: TSWriter) {
    const wl = new TSWriteLine(wr);
    wl.writeLine(0, 'public coerce(val?: PartialType):');
    wl.writeLine(1, 'Optional.Option<PartialType> {');
    wl.writeLine(1, `if (typeof val !== 'object') {`);
    wl.writeLine(2, 'return Optional.NoneOption;');
    wl.writeLine(1, '}');

    wl.writeLine(1, 'let ret: PartialMutableType = {};');
    wl.writeLine(1, 'let found = false;');
    this.def.attributes.forEach((i) => {
      wl.writeLine(
        1,
        `const my${i.name} = this.attributeByName.${i.name}.type.coerce(val.${i.name
        }) as Optional.Option<${typeDefinition(i.type, 'Type')}>;`,
      );
      wl.writeLine(1, `if (Optional.isSome(my${i.name})) {`);
      wl.writeLine(2, `found = true;`);
      wl.writeLine(2, `ret.${i.name} = my${i.name}.some;`);
      wl.writeLine(1, `}`);
    });
    wl.writeLine(1, 'return found ? Optional.SomeOption(ret) : Optional.NoneOption;');
    wl.writeLine(0, '}');

    return wl.toString();
  }

  private writeStaticGivenInitial(wr: TSWriter) {
    const wl = new TSWriteLine(wr);
    wl.write(0, `public static readonly givenInitial: Optional.Option<PartialType>`);
    if (Optional.isSome(this.def.givenInitial)) {
      wl.writeLine(
        0,
        ` = Optional.SomeOption(${tsStringify(this.def.givenInitial.some, this.def, wr)});`,
      );
    } else {
      wl.writeLine(0, ' = Optional.NoneOption;');
    }
    return wl.toString();
  }

  private writeDefinition(wl: TSWriteLine) {
    wl.writeLine(1, `\nexport class Definition extends Types.Struct.AbstractDefinition<Type, PartialType> {`);
    wl.writeLine(2, this.writeAttributes(wl.wr));
    // wl.writeLine(2, this.writeInitial(wl.wr));
    wl.writeLine(2, `public readonly type: Types.Base.TypeName = Types.Struct.Definition.type;`);
    wl.writeLine(2, `public readonly name: string = '${this.def.name}';`);
    wl.writeLine(2, `public readonly bytes: number = ${this.def.bytes};`);
    wl.writeLine(
      2,
      `public readonly alignFuncs: Align.Funcs<string> = { element: ${wl.wr.quote(
        this.def.alignFuncs.element,
      )}, overall: ${wl.wr.quote(this.def.alignFuncs.overall)} };`,
    );
    wl.writeLine(
      2,
      `public readonly attributes: typeof Definition.Attributes = Definition.Attributes;`,
    );
    wl.writeLine(
      2,
      `public readonly attributeByName: typeof Definition.AttributeByName = Definition.AttributeByName;`,
    );
    // wl.writeLine(2, `public readonly initial: Partial<Type>;`);
    wl.writeLine(2, `public readonly givenInitial: Optional.Option<PartialType>;`);
    wl.writeLine(2, ``);
    // wl.writeLine(2, 'public readonly fromStream: FromStreamFN = Definition.fromStream;');

    wl.writeLine(2, this.writeFromStream(wl.wr));

    wl.writeLine(2, this.writeCreateFunction(wl.wr));
    wl.writeLine(2, this.writeToStream(wl.wr));
    wl.writeLine(2, this.writeFilterFunction(wl.wr));
    wl.writeLine(2, `constructor(props?: { initial?: Partial<Type> }) {`);
    wl.writeLine(3, `super();`);
    wl.writeLine(3, `const my = (props || {}).initial;`);
    wl.writeLine(3, `this.givenInitial = Utils.nestedAssign(undefined, {},`);
    wl.writeLine(4, `Optional.OrUndefined(this.coerce(my)) || {},`);
    wl.writeLine(4, `Optional.OrUndefined(Definition.givenInitial) || {});`);
    // wl.writeLine(3, `this.initial = this.create(my);`);
    wl.writeLine(2, `}`);

    wl.writeLine(1, `}\n`);
  }
  public getArrayLengths<B>(def: Types.Base.Definition<B>, ret = ''): string {
    if (def.type === Types.FixedArray.Definition.type) {
      if (ret.length) {
        ret += ', ';
      }
      const adef = (def as unknown) as Types.FixedArray.ArrayTypeAttribute<B>;
      ret += `${adef.length}`;
      return this.getArrayLengths(adef.element, ret);
    }
    return ret;
  }
  public writeCreateAttribute<B>(
    _level: number,
    _attr: Types.Base.Definition<B>,
    aname: string,
    vname: string,
  ): string {
    return `Definition.AttributeByName.${aname}.type.create(${vname}) as ${typeDefinition(
      _attr,
      'Type',
    )}`;
  }
  private emptyNestedArray<B>(type: Types.Base.Definition<B>): string {
    switch (Types.toAttributeType(type)) {
    case Types.AttributeType.FixedArray:
      const adef = (type as unknown) as Types.FixedArray.ArrayTypeAttribute<B>;
      if (Types.toAttributeType(adef.element) !== Types.AttributeType.FixedArray) {
        return '[]';
      }
      return `[ ${Array(adef.length)
        .fill(0)
        .map((_, i) => this.emptyNestedArray(adef.element))
        .join(', ')} ]`;
    case Types.AttributeType.Scalar:
    case Types.AttributeType.Struct:
      return '[]';
    }
  }
  private writeCreateFunction(wr: TSWriter) {
    const wl = new TSWriteLine(wr);
    // wl.writeLine(0, 'export function create(...rargs: Partial<Type>[]): Type {');
    wl.writeLine(0, 'public create(...rargs: PartialType[]): Type {');
    wl.writeLine(1, `const data = rargs.concat(Optional.OrUndefined(this.givenInitial) || [])`);
    wl.writeLine(2, `.filter(i => Optional.isSome(this.coerce(i))).reduce((r, i) => {`);
    this.def.attributes.forEach((i) => {
      wl.writeLine(2, `if (i.${i.name} !== undefined) {`);
      wl.writeLine(3, `r.${i.name}.push(i.${i.name});`);
      wl.writeLine(2, `}`);
    });
    wl.writeLine(2, 'return r;');
    wl.writeLine(1, `}, {`);
    this.def.attributes.forEach((i) => {
      wl.writeLine(
        2,
        `${i.name}: ${this.emptyNestedArray(i.type)} as ${typeDefinition(
          i.type,
          'PartialType',
          (s) => `${s}`,
        )}[],`,
      );
      this.addTypeReference(wl.wr, i.type);
    });
    wl.writeLine(1, '});');
    wl.writeLine(1, `return {`);
    this.def.attributes.forEach((attr) => {
      wl.writeLine(
        2,
        `${attr.name}: ${this.writeCreateAttribute(
          0,
          attr.type,
          attr.name,
          `...data.${attr.name}`,
        )},`,
      );
    });
    wl.writeLine(1, `};`);
    wl.writeLine(0, '}');
    return wl.toString();
  }

  private fromStreamAction<B>(
    wr: TSWriter,
    attrName: string,
    def: Types.Base.Definition<B>,
    stype: string,
    level = 0,
    itemName?: string,
  ): string {
    switch (Types.toAttributeType(def)) {
    case Types.AttributeType.Scalar:
      if (def.type === Types.FixedCString.Definition.type) {
        // const cdef = (def as unknown) as Types.FixedCString.Definition;
        return `Definition.AttributeByName.${attrName}.${stype}.fromStreamChunk(nrb, ${wr.backQuote(
          itemName || attrName,
        )}) as number[]`;
      } else if (def.type === Types.BitStruct.Definition.type) {
        // const bdef = (def as unknown) as Types.BitStruct.Definition;
        return `Definition.AttributeByName.${attrName}.${stype}.fromStreamChunk(nrb, ${wr.backQuote(
          itemName || attrName,
        )})`;
      }
      return `Definition.AttributeByName.${attrName}.${stype}.fromStreamChunk(nrb, ${wr.backQuote(
        itemName || attrName,
      )})`;
      // return `nrb.read${def.type}()`;
    case Types.AttributeType.Struct:
      // const sdef = def as Types.Base.NamedType<B>;
      return `Definition.AttributeByName.${attrName}.${stype}.fromStreamChunk(nrb, ${wr.backQuote(
        itemName || attrName,
      )})`;
    case Types.AttributeType.FixedArray:
      return `Definition.AttributeByName.${attrName}.${stype}.fromStreamChunk(nrb, ${wr.backQuote(
        itemName || attrName,
      )}) as ${typeDefinition(def, 'Type')}`;
      // return this.writeStreamArrayAction(wr, attrName, def, 'type.element', level, itemName || attrName);
    }
    throw Error(`fromStreamAction: ${def.type}`);
  }
  private writeFromStream(wr: TSWriter) {
    const wl = new TSWriteLine(wr);
    wl.writeLine(
      0,
      'public static fromStreamChunk(nrb: ChunkBuffer, name: string = this.name): Type {',
    );
    wl.writeLine(1, 'return {');
    this.def.attributes.forEach((i) => {
      wl.writeLine(2, `${i.name}: ${this.fromStreamAction(wl.wr, i.name, i.type, 'type')},`);
    });
    wl.writeLine(1, '};');
    wl.writeLine(0, '}');
    wl.writeLine(0, '');
    wl.writeLine(0, 'public static fromStream(rb: StreamBuffer, name: string = this.name): Type {');
    wl.writeLine(
      1,
      `return rb.prepareRead(name, ${this.def.bytes}, (nrb) => this.fromStreamChunk(nrb, name));`,
    );
    wl.writeLine(0, '}');

    wl.writeLine(0, '');
    wl.writeLine(0, '// tslint:disable-next-line: typedef');
    wl.writeLine(0, 'public readonly fromStreamChunk = Definition.fromStreamChunk;');
    wl.writeLine(0, '');
    return wl.toString();
  }
  private toStreamAction<B>(
    level: number,
    wr: TSWriter,
    aname: string,
    vname: string,
    def: Types.Base.Definition<B>,
  ): string {
    switch (Types.toAttributeType(def)) {
    case Types.AttributeType.Scalar:
      if (def.type === Types.BitStruct.Definition.type) {
        // const bdef = (def as unknown) as Definition.Types.BitStruct;
        return `Definition.AttributeByName.${aname}.type.toStreamChunk(${vname}, nwb, name)`;
      } else if (def.type === Types.FixedCString.Definition.type) {
        // const cdef = (def as unknown) as Types.FixedCString.Definition;
        return `Definition.AttributeByName.${aname}.type.toStreamChunk(${vname}, nwb, name)`;
      }
      return `Definition.AttributeByName.${aname}.type.toStreamChunk(${vname}, nwb, name)`;
      // return `nwb.write${def.type}(${vname})`;
    case Types.AttributeType.Struct:
      // const sdef = def as Types.Type.DefinitionNameAttribute<B>;
      // return `${sdef.name}.toStream(${aname}, nwb.sbuf)`;
      return `Definition.AttributeByName.${aname}.type.toStreamChunk(${vname}, nwb, name)`;
      break;
    case Types.AttributeType.FixedArray:
      // const adef = (def as unknown) as Types.FixedArray.ArrayTypeAttribute<B>;
      return `Definition.AttributeByName.${aname}.type.toStreamChunk(${vname}, nwb, name)`;
      /*
          ${
          adef.length
        }, (idx${level}) => ${this.toStreamAction(
          level + 1,
          wr,
          'XXXXX',
          `(${vname} || [])[idx${level}]`,
          adef.element,
        )})`;
        */
    }
  }
  private writeToStream(wr: TSWriter) {
    const wl = new TSWriteLine(wr);
    wl.writeLine(
      0,
      'public toStreamChunk(data: Partial<Type>, nwb: ChunkBuffer, name: string = this.name): void {',
    );
    wl.writeLine(1, 'const tmp = this.create(data);');
    this.def.attributes.forEach((i) => {
      wl.writeLine(1, this.toStreamAction(0, wl.wr, i.name, `tmp.${i.name}`, i.type) + ';');
    });
    wl.writeLine(0, '}');
    wl.writeLine(0, '');
    wl.writeLine(
      0,
      'public toStream(data: Partial<Type>, wb: StreamBuffer, name: string = this.name): StreamBuffer {',
    );
    wl.writeLine(
      1,
      `return wb.prepareWrite(name, ${this.def.bytes}, (nwb) => this.toStreamChunk(data, nwb, name));`,
    );
    wl.writeLine(0, '}');
    return wl.toString();
  }
  public write(wr: TSWriter): TSWriteLine {
    const wl = new TSWriteLine(wr);
    wl.writeLine(0, `export namespace ${this.def.name} {`);
    this.writeInterface(wl);
    this.writeDefinition(wl);
    // writeCloneFunction(wl);
    // this.writeToStream(wl);
    wl.writeLine(0, '}');
    this.imports.prepend(wl, this.def);
    return wl;
  }
  // public toString() {
  //   return wl.toString();
  // }
}
