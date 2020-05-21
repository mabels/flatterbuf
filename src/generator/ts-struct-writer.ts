import { Definition } from '../definition';
// import { Runtime } from '../runtime';
import { type } from 'os';
import {
  TSWriteLine,
  TSWriterArgs,
  TSWriter,
  attributeDefinition,
  typeDefinition,
  initialValue,
  TSRefWriter
} from './ts';
import { TSImports, TSImport } from './ts-imports';

export class TSStructWriter<T> implements TSRefWriter {
  public readonly fname: string;
  private readonly imports: TSImports<T>;
  constructor(
    public readonly def: Definition.Types.Struct,
    public readonly level: number,
    public readonly args: TSWriterArgs,
  ) {
    this.imports = new TSImports(args);
    this.fname = `${args.generationPath}${this.def.name.toLowerCase()}`;
  }
  private writeStructAttributeReflection<B>(
    wr: TSWriter,
    attr: Definition.Types.StructAttributeOfs<B>
  ) {
    const wl = new TSWriteLine(wr);
    wl.writeLine(0, `{`);
    wl.writeLine(1, `name: ${wl.wr.quote(attr.name)},`);
    wl.writeLine(1, `ofs: ${attr.ofs},`);
    // wl.writeLine(1, `notRequired: ${attr.notRequired.toString()},`);
    wl.writeLine(1, `type: ${this.getTypeDefinition(wl.wr, attr.type)}`);
    wl.write(0, `}`);
    return wl.toString();
  }
  private alignFuncs(wr: TSWriter, alignFuncs: Definition.Align.Funcs<string>) {
    return `{ element: ${wr.quote(alignFuncs.element)}, overall: ${wr.quote(alignFuncs.overall)} }`;
  }
  private arrayInitial<B>(wr: TSWriter, length: number, vals: B[]): string {
    return vals
      .slice(0, length)
      .map(i => {
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
  private initialValue<B, V>(wr: TSWriter, def: Definition.Types.Type<V>): string {
    switch (def.type) {
      case Definition.Types.Uint64.type:
      case Definition.Types.Long.type:
        const hl = (def as unknown as Definition.Types.Type<Definition.Types.HighLow>).initial;
        return `{ high: ${hl.high}, low: ${hl.low} }`;
      case Definition.Types.Boolean.type:
        return `${!!def.initial}`;
      case Definition.Types.Char.type:
      case Definition.Types.Uint8.type:
      case Definition.Types.Uint16.type:
      case Definition.Types.Short.type:
      case Definition.Types.Uint32.type:
      case Definition.Types.Int.type:
        return `${~~def.initial}`;
      case Definition.Types.Float.type:
      case Definition.Types.Double.type:
        return `${def.initial}`;
      case Definition.Types.FixedCString.type:
        const scdef = def as unknown as Definition.Types.FixedCString;
        return `[${scdef.initial.join(', ')}]`;
      case Definition.Types.BitStruct.type:
        const bdef = def as unknown as Definition.Types.BitStruct;
        const out = ['{'];
        bdef.bits.forEach(bit => {
          const typ = typeof bdef.initial[bit.name];
          if (typ === 'number') {
            out.push(`${wr.indent(1)}${bit.name}: ${bdef.initial[bit.name]},`);
          } else if (typ === 'boolean') {
            out.push(`${wr.indent(1)}${bit.name}: ${bdef.initial[bit.name].toString()},`);
          }
        });
        out.push('}');
        return out.join('\n');
      case Definition.Types.Struct.type:
        return `Struct`;
      case Definition.Types.FixedArray.type:
        // return `Reflection.attributes[${wr.quote(sdef.name)}].initial`;
        return `FixedArray`;
      default:
        throw Error(`initialValue failed for: ${def.type}`);
    }
  }
  private getTypeDefinition<B>(wr: TSWriter, tdef: Definition.Types.Type<B>): string {
    const wl = new TSWriteLine(wr);
    switch (tdef.type) {
      case Definition.Types.Boolean.type:
        wl.writeLine(0, `new __Definition.Types.Boolean({`);
        wl.writeLine(1, `initial: ${this.initialValue(wr, tdef)}`);
        wl.write(0, `})`);
        break;
      case Definition.Types.Char.type:
      case Definition.Types.Uint8.type:
      case Definition.Types.Uint16.type:
      case Definition.Types.Short.type:
      case Definition.Types.Uint32.type:
      case Definition.Types.Int.type:
      case Definition.Types.Float.type:
      case Definition.Types.Double.type:
        wl.writeLine(0, `new __Definition.Types.${tdef.type}({`);
        wl.writeLine(1, `initial: ${this.initialValue(wr, tdef)}`);
        wl.write(0, `})`);
        break;
      case Definition.Types.Uint64.type:
      case Definition.Types.Long.type:
        {
          const val = { high: 0, low: 0 };
          const sdef = ((tdef as unknown) as Definition.Types.Type<Definition.Types.HighLow>)
            .initial;
          if (sdef && typeof sdef.high) {
            val.high = sdef.high;
          }
          if (sdef && typeof sdef.low) {
            val.low = sdef.low;
          }
          wl.writeLine(0, `new __Definition.Types.${tdef.type}({`);
          wl.writeLine(1, `initial: { high: ${val.high}, low: ${val.low} }`);
          wl.write(0, `})`);
        }
        break;
      case Definition.Types.BitStruct.type:
        {
          const bdef = (tdef as unknown) as Definition.Types.BitStruct;
          this.addTypeReference(wr, bdef);
          wl.writeLine(1, `new ${bdef.name}.Definition({`);
          wl.writeLine(1, `initial: {`);
          bdef.bits.forEach(bit => {
            const typ = typeof bdef.initial[bit.name];
            if (typ === 'number') {
              wl.writeLine(2, `${bit.name}: ${bdef.initial[bit.name]},`);
            } else if (typ === 'boolean') {
              wl.writeLine(2, `${bit.name}: ${bdef.initial[bit.name].toString()},`);
            }
          });
          wl.writeLine(1, `}`);
          wl.write(0, `})`);
        }
        break;
      // {
      //   const bdef = (attr as unknown) as Definition.Types.BitStruct;
      //   wl.writeLine(0, `new Definition.Types.${attr.type}({`);
      //   wl.writeLine(ident + 2, `name: ${wr.quote(bdef.name)},`);
      //   wl.writeLine(ident + 2, `length: ${bdef.length},`);
      //   wl.writeLine(ident + 2, `initial: ${JSON.stringify(Object.values(bdef.initial).reduce((r, v) => {
      //     r[v.name] = v.initial || 0;
      //     return r;
      //   }, {} as Definition.Types.BitStructInitalArg))}`);
      //   wl.write(ident + 1, `})`);
      // }
      // break;
      case Definition.Types.Struct.type:
        {
          const sdef = tdef as Definition.Types.NamedType<B>;
          this.addTypeReference(wr, sdef);
          wl.write(1, `${sdef.name}.Reflection.prop`);
        }
        break;
      case Definition.Types.FixedCString.type:
      case Definition.Types.FixedArray.type:
        const adef = (tdef as unknown) as Definition.Types.FixedArray<B>;
        wl.writeLine(0, `new __Definition.Types.${tdef.type}({`);
        wl.writeLine(1, `length: ${adef.length},`);
        wl.writeLine(1, `alignFuncs: ${this.alignFuncs(wr, adef.alignFuncs)},`);
        if (tdef.type !== Definition.Types.FixedCString.type) {
          wl.writeLine(1, `element: ${this.getTypeDefinition(wr, adef.element)},`);
        }
        if (adef.initial != undefined) {
          wl.writeLine(1, `initial: [${this.arrayInitial(wr, adef.length, adef.initial)}]`);
        }
        wl.write(0, `})`);
        break;
      default:
        throw Error(`getTypeDefinition failed for: ${tdef.type}`);
    }
    return wl.toString();
  }

  private addTypeReference<B>(wr: TSWriter, def: Definition.Types.Type<B>) {
    if (Definition.Types.isScalar(def)) {
      if (def.type === Definition.Types.BitStruct.type) {
        const bdef = (def as unknown) as Definition.Types.BitStruct;
        const tsw = wr.bitStructClass(bdef, this.level + 1);
        this.imports.add(new TSImport({ sWriter: tsw.writer }));
      }
      return;
    }
    if (Definition.Types.isFixedArray(def)) {
      const adef = (def as unknown) as Definition.Types.ArrayTypeAttribute<B>;
      this.addTypeReference(wr, adef.element);
      return;
    }
    if (Definition.Types.isStruct(def)) {
      const sdef = (def as unknown) as Definition.Types.Struct;
      const tsw = wr.structClass(sdef, this.level + 1);
      // console.log('addTypeReference of ', this.fname, sdef.name, m.name);
      this.imports.add(new TSImport({ sWriter: tsw.writer }));
      return;
    }
    throw Error(`addTypeReferenced for unknown type:${def.type}`);
  }
  public writeInterface(wl: TSWriteLine) {
    wl.writeLine(1, `export interface MutableType extends __Definition.Types.StructInitial {`);
    const sdef = this.def as Definition.Types.Struct;
    sdef.attributes.forEach(i => {
      this.addTypeReference(wl.wr, i.type);
      wl.writeLine(2, `${attributeDefinition(i)}: ${typeDefinition(i.type)};`);
    });
    wl.writeLine(1, '}');
    wl.writeLine(1, 'export type Type = Readonly<MutableType>;');
  }

  public writeTSObjectItem(wr: TSWriter, v: any): string {
    if (Array.isArray(v)) {
      return [`[\n`, ...v.map(i => this.writeTSObjectItem(wr, i)), `\n],`].join('');
    } else if (typeof v === 'object') {
      return this.writeTSObject(wr, v);
    } else if (typeof v === 'string') {
      return wr.quote(v) + ',';
    }
    return v.toString() + ',';
  }
  private writeTSObject(wr: TSWriter, hl: { [id: string]: any }): string {
    const mid = Array.from(Object.entries(hl))
      .filter(([_, v]) => v !== undefined)
      .map(([_, v]) => {
        return this.writeTSObjectItem(wr, v);
      });
    return [`{\n`, ...mid, `\n},`].join('');
  }

  private writeInitial(wr: TSWriter) {
    const wl = new TSWriteLine(wr);
    // Global(structlevel),
    // Local(attribute),
    // Type(typelevel)

    // wl.writeLine(0, `public static readonly Initial: Partial<Type> = {`);
    // this.def.attributes.forEach((attr) => {
    //   switch (Definition.Types.toAttributeType(attr.type)) {
    //     case Definition.Types.AttributeType.FixedArray:
    //       throw 'Jojo';
    //     case Definition.Types.AttributeType.Struct:
    //       const sdef = attr.type as unknown as Definition.Types.Struct;
    //       wl.writeLine(1, `// ${JSON.stringify(sdef.initial)}`);
    //       wl.writeLine(1, `${attr.name}: ${sdef.name}.Definition.Initial,`);
    //       break;
    //     case Definition.Types.AttributeType.Scalar:
    //       const stinitial = this.def.initial[attr.name];
    //       if (Definition.Types.isBitStruct(attr.type)) {
    //         const bdef = attr.type as unknown as Definition.Types.BitStruct;
    //         wl.writeLine(1, `// ${JSON.stringify(bdef.initial)}`);
    //         wl.writeLine(1, `// ${JSON.stringify(this.def.initial[attr.name])}`);
    //         wl.writeLine(1, `${attr.name}: ${bdef.name}.Definition.Initial,`);
    //         break;
    //       }
    //       if (Definition.Types.isFixedCString(attr.type)) {
    //         const csdef = attr.type as unknown as Definition.Types.FixedCString;
    //         wl.writeLine(1, `${attr.name}: [${csdef.create(stinitial, attr.initial, attr.type.initial).join(', ')}],`);
    //         break;
    //       }
    //       if (Definition.Types.isHighLow(attr.type)) {
    //         const hl = attr.type.create(stinitial, attr.initial, attr.type.initial);
    //         wl.writeLine(1, `${attr.name}: { high: ${hl.high}, low: ${hl.low} },`);
    //         break;
    //       }
    //       const scdef = attr.type as unknown as Definition.Types.Type<unknown>;
    //       if ((this.def.initial || {}).hasOwnProperty(attr.name)) {
    //         wl.writeLine(1, `${attr.name}: ${scdef.create(stinitial, attr.initial, attr.type.initial)},`);
    //       }
    //       break;
    //     case Definition.Types.AttributeType.FixedArray:
    //       throw 'Jojo';
    //   }
    // });
    // wl.writeLine(0, '};');
    return wl.toString();
  }

  private writeAttributes(wr: TSWriter) {
    const wl = new TSWriteLine(wr);
    wl.writeLine(0, '// tslint:disable-next-line: typedef');
    wl.writeLine(0, `public static readonly AttributeByName = {`);
    this.def.attributes.forEach((attr) => {
      wl.writeLine(1, `${attr.name}: ${this.writeStructAttributeReflection(wl.wr, attr)},`);
    });
    wl.writeLine(0, `};\n`);
    wl.writeLine(0, `public static readonly Attributes: __Definition.Types.StructAttributeOfs<unknown>[] = [`);
    this.def.attributes.forEach((attr) => {
      wl.writeLine(1, `Definition.AttributeByName.${attr.name},`);
    });
    wl.writeLine(0, '];');
    return wl.toString();
  }
  // public writeFilterPartialType(wl: TSWriteLine) {
  //   wl.writeLine(2, `function filterPartialType(initial?: Partial<Type>): Partial<Type> {`);
  //   wl.writeLine(3, `if (typeof initial !== 'object') {`);
  //   wl.writeLine(4, `return {};`);
  //   wl.writeLine(3, `}`);
  //   wl.writeLine(3, `const ret: any = {};`);
  //   this.def.attributes.forEach(bit => {
  //     wl.writeLine(3, `if (typeof initial.${bit.name} === '${typeof bit.initial}') {`);
  //     wl.writeLine(4, `ret.${bit.name} = initial.${bit.name};`);
  //     wl.writeLine(3, `}`);
  //   });
  //   wl.writeLine(3, `return ret;`);
  //   wl.writeLine(3, `}\n`);
  // }

  // public writeInitial(wr: TSWriter): string {
  //   const initial = typeof this.def.initial === 'object' ? this.def.initial : {};
  //   return this.def.attributes.map(attr => {
  //     let val = attr.type.initial;
  //     if (initial[attr.name] !== undefined) {
  //       val = initial[attr.name];
  //     }
  //     return `${attr.name}: ${this.initialValue(wr, attr.type)},`;
  //   }).join('\n');
  // }

  private writeFilterFunction(wr: TSWriter) {
    const wl = new TSWriteLine(wr);
    wl.writeLine(0, 'public coerce(val?: __Definition.Utils.NestedPartial<Type>):');
    wl.writeLine(1, '__Definition.Utils.Option<__Definition.Utils.NestedPartial<Type>> {');
    wl.writeLine(1, `if (typeof val !== 'object') {`);
    wl.writeLine(2, 'return __Definition.Utils.NoneOption;');
    wl.writeLine(1, '}');

    wl.writeLine(1, 'let ret: __Definition.Utils.NestedPartial<MutableType> = {};');
    wl.writeLine(1, 'let found = false;');
    this.def.attributes.forEach(i => {
      wl.writeLine(1, `const my${i.name} = this.attributeByName.${i.name}.type.coerce(val.${i.name});`);
      wl.writeLine(1, `if (__Definition.Utils.isSome(my${i.name})) {`);
      wl.writeLine(2, `found = true;`);
      wl.writeLine(2, `ret.${i.name} = my${i.name}.some;`);
      wl.writeLine(1, `}`);
    });
    wl.writeLine(1, 'return found ? __Definition.Utils.SomeOption(ret) : __Definition.Utils.NoneOption;');
    wl.writeLine(0, '}');

    return wl.toString();
  }

  private writeReflection(wl: TSWriteLine) {
    wl.writeLine(
      1,
      `\nexport class Definition implements __Definition.Types.Struct {`,
    );
    wl.writeLine(2, this.writeAttributes(wl.wr));
    wl.writeLine(2, this.writeInitial(wl.wr));
    wl.writeLine(
      2,
      `public readonly type: __Definition.Types.TypeName = __Definition.Types.Struct.type;`,
    );
    wl.writeLine(2, `public readonly name: string = '${this.def.name}';`);
    wl.writeLine(2, `public readonly bytes: number = ${this.def.bytes};`);
    wl.writeLine(2, `public readonly alignFuncs: __Definition.Align.Funcs<string> = { element: ${wl.wr.quote(this.def.alignFuncs.element)}, overall: ${wl.wr.quote(this.def.alignFuncs.overall)} };`);
    wl.writeLine(2, `public readonly attributes: typeof Definition.Attributes = Definition.Attributes;`);
    wl.writeLine(2, `public readonly attributeByName: typeof Definition.AttributeByName = Definition.AttributeByName;`);
    wl.writeLine(2, `public readonly initial: Partial<Type>;`);
    wl.writeLine(2, `public readonly givenInitial: __Definition.Utils.Option<__Definition.Utils.NestedPartial<Type>>;`);
    wl.writeLine(2, ``);
    wl.writeLine(2, this.writeFromStream(wl.wr));
    wl.writeLine(2, this.writeCreateFunction(wl.wr));
    wl.writeLine(2, this.writeToStream(wl.wr));
    wl.writeLine(2, this.writeFilterFunction(wl.wr));
    wl.writeLine(2, `constructor(props?: { initial?: Partial<Type> }) {`);
    wl.writeLine(3, `const my = (props || {}).initial;`);
    wl.writeLine(3, `this.givenInitial = this.coerce(my);`);
    wl.writeLine(3, `this.initial = this.create(my);`);
    wl.writeLine(2, `}`);

    wl.writeLine(1, `}\n`);
  }
  public getArrayLengths<B>(def: Definition.Types.Type<B>, ret = ''): string {
    if (def.type === Definition.Types.FixedArray.type) {
      if (ret.length) {
        ret += ', ';
      }
      const adef = (def as unknown) as Definition.Types.ArrayTypeAttribute<B>;
      ret += `${adef.length}`;
      return this.getArrayLengths(adef.element, ret);
    }
    return ret;
  }
  public writeCreateAttribute<B>(
    _level: number,
    _attr: Definition.Types.Type<B>,
    aname: string,
    vname: string,
  ): string {
    return `Definition.AttributeByName.${aname}.type.create(${vname})`;
    /*
    switch (Definition.Types.toAttributeType(attr)) {
      case Definition.Types.AttributeType.Scalar:
        if (attr.type === Definition.Types.FixedCString.type) {
          const cdef = (attr as unknown) as Definition.Types.FixedCString;
          return `Definition.Types.${attr.type}.create(${cdef.length}, ${vname})`;
        } else if (attr.type === Definition.Types.BitStruct.type) {
          const cdef = (attr as unknown) as Definition.Types.BitStruct;
          return `${cdef.name}.create(${vname})`;
        }
        // return `Definition.Types.${attr.type}.create(${vname})`;
      case Definition.Types.AttributeType.FixedArray:
        const adef = (attr as unknown) as Definition.Types.ArrayTypeAttribute<B>;
        return `Definition.Types.${attr.type}.create([${this.getArrayLengths(adef)}], ${vname})`;
      case Definition.Types.AttributeType.Struct:
        const sdef = (attr as unknown) as Definition.Types.Struct;
        return `${sdef.name}.create(${vname})`;
    }
    */
  }
  private emptyNestedArray<B>(type: Definition.Types.Type<B>): string {
    switch (Definition.Types.toAttributeType(type)) {
      case Definition.Types.AttributeType.FixedArray:
        const adef = (type as unknown) as Definition.Types.ArrayTypeAttribute<B>;
        if (
          Definition.Types.toAttributeType(adef.element) !==
          Definition.Types.AttributeType.FixedArray
        ) {
          return '[]';
        }
        return `[ ${Array(adef.length)
          .fill(0)
          .map((_, i) => this.emptyNestedArray(adef.element))
          .join(', ')} ]`;
      case Definition.Types.AttributeType.Scalar:
      case Definition.Types.AttributeType.Struct:
        return '[]';
    }
  }
  private writeCreateFunction(wr: TSWriter) {
    const wl = new TSWriteLine(wr);
    // wl.writeLine(0, 'export function create(...rargs: Partial<Type>[]): Type {');
    wl.writeLine(0, 'public create(...rargs: __Definition.Utils.NestedPartial<Type>[]): Type {');
    wl.writeLine(1, `const data = rargs.concat(__Definition.Utils.OrUndefined(this.givenInitial))`);
    wl.writeLine(2, `.filter(i => __Definition.Utils.isSome(this.coerce(i))).reduce((r, i) => {`);
    this.def.attributes.forEach(i => {
      wl.writeLine(2, `if (i.${i.name} !== undefined) {`);
      wl.writeLine(3, `r.${i.name}.push(i.${i.name});`);
      wl.writeLine(2, `}`);
    });
    wl.writeLine(2, 'return r;');
    wl.writeLine(1, `}, {`);
    this.def.attributes.forEach(i => {
      wl.writeLine(
        2,
        `${i.name}: ${this.emptyNestedArray(i.type)} as ${typeDefinition(i.type,
          (s) => `__Definition.Utils.NestedPartial<${s}>`)}[],`,
      );
      if (Definition.Types.isStruct(i.type) || Definition.Types.BitStruct.type === i.type.type) {
        this.addTypeReference(wl.wr, i.type);
      }
    });
    wl.writeLine(1, '});');
    wl.writeLine(1, `return {`);
    this.def.attributes.forEach(attr => {
      wl.writeLine(
        2,
        `${attr.name}: ${this.writeCreateAttribute(0, attr.type, attr.name, `...data.${attr.name}`)},`,
      );
    });
    wl.writeLine(1, `};`);
    wl.writeLine(0, '}');
    return wl.toString();
  }
  private fromStreamAction<B>(level: number, wr: TSWriter, def: Definition.Types.Type<B>): string {
    switch (Definition.Types.toAttributeType(def)) {
      case Definition.Types.AttributeType.Scalar:
        if (def.type === Definition.Types.FixedCString.type) {
          const cdef = def as unknown as Definition.Types.FixedCString;
          return `__Runtime.Types.FixedCString.fromStream({ length: ${cdef.length}, bytes: ${cdef.bytes} }, nrb)`;
        } else if (def.type === Definition.Types.BitStruct.type) {
          const bdef = def as unknown as Definition.Types.BitStruct;
          return `${bdef.name}.Definition.fromStream(nrb.sbuf)`;
        }
        return `nrb.read${def.type}()`;
      case Definition.Types.AttributeType.Struct:
        const sdef = def as Definition.Types.NamedType<B>;
        return `${sdef.name}.Definition.fromStream(nrb.sbuf)`;
      case Definition.Types.AttributeType.FixedArray:
        const adef = (def as unknown) as Definition.Types.ArrayTypeAttribute<B>;
        return `__Runtime.Types.${def.type}.fromStream(${
          adef.length
        }, (idx${level}) => ${this.fromStreamAction(level + 1, wr, adef.element)})`;
    }
    // throw Error(`fromStreamAction: ${type.type}`);
  }
  private writeFromStream(wr: TSWriter) {
    const wl = new TSWriteLine(wr);
    wl.writeLine(0, 'public static fromStream(rb: __Runtime.StreamBuffer): Type {');
    wl.writeLine(
      1,
      `return rb.prepareRead(${wl.wr.quote(this.def.name)}, ${this.def.bytes}, (nrb) => ({`,
    );
    this.def.attributes.forEach(i => {
      wl.writeLine(2, `${i.name}: ${this.fromStreamAction(0, wl.wr, i.type)},`);
    });
    wl.writeLine(1, '}));');
    wl.writeLine(0, '}');
    return wl.toString();
  }
  private toStreamAction<B>(
    level: number,
    wr: TSWriter,
    aname: string,
    vname: string,
    def: Definition.Types.Type<B>,
  ): string {
    switch (Definition.Types.toAttributeType(def)) {
      case Definition.Types.AttributeType.Scalar:
        if (def.type === Definition.Types.BitStruct.type) {
          // const bdef = (def as unknown) as Definition.Types.BitStruct;
          return `Definition.AttributeByName.${aname}.type.toStream(${vname}, nwb.sbuf)`;
        } else if (def.type === Definition.Types.FixedCString.type) {
          const cdef = (def as unknown) as Definition.Types.FixedCString;
          return `__Runtime.Types.FixedCString.toStream({ bytes: ${cdef.bytes}, length: ${cdef.length} }, ${vname}, nwb)`;
        }
        return `nwb.write${def.type}(${vname})`;
      case Definition.Types.AttributeType.Struct:
        // const sdef = def as Definition.Types.TypeNameAttribute<B>;
        // return `${sdef.name}.toStream(${aname}, nwb.sbuf)`;
        return `Definition.AttributeByName.${aname}.type.toStream(${vname}, nwb.sbuf)`;
        break;
      case Definition.Types.AttributeType.FixedArray:
        const adef = (def as unknown) as Definition.Types.ArrayTypeAttribute<B>;
        return `__Runtime.Types.${def.type}.toStream(${
          adef.length
        }, (idx${level}) => ${this.toStreamAction(
          level + 1,
          wr,
          'XXXXX',
          `(${vname} || [])[idx${level}]`,
          adef.element,
        )})`;
    }
  }
  private writeToStream(wr: TSWriter) {
    const wl = new TSWriteLine(wr);
    wl.writeLine(0, 'public toStream(data: Partial<Type>,');
    wl.writeLine(1, 'wb: __Runtime.StreamBuffer): __Runtime.StreamBuffer {');
    wl.writeLine(
      1,
      `return wb.prepareWrite(${wl.wr.quote(this.def.name)}, ${this.def.bytes}, (nwb) => {`,
    );
    wl.writeLine(2, 'const tmp = this.create(data);');
    this.def.attributes.forEach(i => {
      wl.writeLine(2, this.toStreamAction(0, wl.wr, i.name, `tmp.${i.name}`, i.type) + ';');
    });
    wl.writeLine(1, '});');
    wl.writeLine(0, '}');
    return wl.toString();
  }
  public write(wr: TSWriter): TSWriteLine {
    const wl = new TSWriteLine(wr);
    wl.writeLine(0, `export namespace ${this.def.name} {`);
    this.writeInterface(wl);
    this.writeReflection(wl);
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
