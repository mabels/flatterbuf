import { Definition as Definition } from '../definition';
import { type } from 'os';
import { TSWriteLine, TSWriterArgs, TSWriter, initialValue, TSRefWriter, writeCloneFunction } from './ts';
import { TSImports } from './ts-imports';

export class TSBitStructWriter<T> implements TSRefWriter {
  public readonly fname: string;
  private readonly imports: TSImports<T>;
  // private readonly imports: Map<string, TSImport<T>> = new Map();
  constructor(public readonly def: Definition.Types.BitStruct, public readonly args: TSWriterArgs) {
    // console.log(`TSBitStructWriter`, def.name, def.bits);
    this.imports = new TSImports(args);
    this.fname = `${args.generationPath}${this.def.name.toLowerCase()}`;
  }

  // private writeBitStructAttributeReflection<B>(
  //   wl: TSWriteLine,
  //   attr: Definition.Types.BitItemWithLength,
  //   comma: string,
  //   ident = 2,
  // ) {
  //   wl.writeLine(comma.length ? 0 : ident, `${comma}{`);
  //   wl.writeLine(ident + 1, `name: ${wl.wr.quote(attr.name)},`);
  //   wl.writeLine(ident + 1, `start: ${attr.start},`);
  //   wl.writeLine(ident + 1, `length: ${attr.length},`);
  //   wl.writeLine(
  //     ident + 1,
  //     `initial: ${Definition.Types.BitStructValue(attr.initial, attr.length).toString()},`,
  //   );
  //   wl.write(ident, `}`);
  // }

  private writeType(wl: TSWriteLine) {
    wl.writeLine(1, `export interface MutableType extends __Definition.Types.BitStructInitial {`);
    this.def.bits.forEach(i => {
      wl.writeLine(2, `${i.name}: ${i.length > 1 ? 'number' : 'boolean'};`);
    });
    wl.writeLine(1, '}');
    wl.writeLine(1, 'export type Type = Readonly<MutableType>;');
  }

  private writeInitial(wr: TSWriter) {
    const wl = new TSWriteLine(wr);
    // wl.writeLine(0, `public static readonly Initial: Type = {`);
    // this.def.bits.forEach(i => {
    //   wl.writeLine(1, `${i.name}: ${i.initial},`);
    // });
    // wl.writeLine(0, '};');
    return wl.toString();
  }

  private writeBitItem(asType: boolean, wr: TSWriter, bit: Definition.Types.BitItemWithLength) {
    const wl = new TSWriteLine(wr);
    wl.writeLine(1, `${bit.name}: {`);
    wl.writeLine(2, `name: ${wr.quote(bit.name)},`);
    wl.writeLine(2, `start: ${bit.start},`);
    wl.writeLine(2, `length: ${bit.length},`);
    const typName = `__Definition.Types.${bit.length === 1 ? 'Boolean' : 'Uint32'}`;
    if (asType) {
      wl.writeLine(2, `type: ${typName};`);
    } else {
      let initVal = '';
      if (bit.initial !== undefined) {
        initVal = `{ initial: ${bit.initial} }`;
      }
      wl.writeLine(2, `type: new ${typName}(${initVal})`);
    }
    wl.writeLine(1, `}${asType ? ';' : ','}`);
    return wl.toString();
  }

  private writeBits(wr: TSWriter) {
    const wl = new TSWriteLine(wr);
    wl.writeLine(0, `public static readonly BitsByName: BitsByName = {`);
    this.def.bits.forEach((bit) => {
      wl.writeLine(1, this.writeBitItem(false, wr, bit));
    });
    wl.writeLine(0, `};\n`);
    wl.writeLine(0, `public static readonly Bits: __Definition.Types.BitItemWithLength[] = [`);
    this.def.bits.forEach((bit) => {
      wl.writeLine(1, `Definition.BitsByName.${bit.name},`);
    });
    wl.writeLine(0, '];');
    return wl.toString();
  }
  // public writeFilterPartialType(wl: TSWriteLine) {
  //   wl.writeLine(2, `function filterPartialType(initial?: Partial<Type>): Partial<Type> {`);
  //   wl.writeLine(3, `if (typeof initial !== 'object') {`);
  //   wl.writeLine(4, `return {};`);
  //   wl.writeLine(3, `};`);
  //   wl.writeLine(3, `const ret: any = {};`);
  //   this.def.bits.forEach(bit => {
  //     wl.writeLine(3, `if (typeof initial.${bit.name} === '${typeof bit.initial}') {`);
  //     wl.writeLine(4, `ret.${bit.name} = initial.${bit.name};`);
  //     wl.writeLine(3, `}`);
  //   });
  //   wl.writeLine(3, `return ret;`);
  //   wl.writeLine(3, `}\n`);
  // }
  private writeBitsByName(wr: TSWriter, wl: TSWriteLine) {
    wl.writeLine(1, '\nexport interface BitsByName extends __Definition.Types.BitsByName {');
    this.def.bits.forEach((bit) => {
      wl.writeLine(2, this.writeBitItem(true, wr, bit));
    });
    wl.writeLine(1, '}');
  }

  private writeDefinition(wl: TSWriteLine) {
    wl.writeLine(
      1,
      `\nexport class Definition implements __Definition.Types.BitStruct {`,
    );
    wl.writeLine(2, this.writeBits(wl.wr));
    wl.writeLine(2, this.writeInitial(wl.wr));
    wl.writeLine(
      2,
      `public readonly type: __Definition.Types.TypeName = __Definition.Types.BitStruct.type;`,
    );
    wl.writeLine(2, `public readonly name: string = '${this.def.name}';`);
    wl.writeLine(2, `public readonly length: number = ${this.def.length};`);
    wl.writeLine(2, `public readonly bytes: number = ${this.def.bytes};`);
    wl.writeLine(2, `public readonly alignFuncs: __Definition.Align.Funcs<string> = { element: ${wl.wr.quote(this.def.alignFuncs.element)}, overall: ${wl.wr.quote(this.def.alignFuncs.overall)} };`);
    wl.writeLine(2, `public readonly bits: typeof Definition.Bits = Definition.Bits;`);
    wl.writeLine(2, `public readonly bitsByName: typeof Definition.BitsByName = Definition.BitsByName;`);
    wl.writeLine(2, `public readonly initial: Partial<Type>;`);
    wl.writeLine(2, `public readonly givenInitial: __Definition.Utils.Option<Partial<Type>>;\n`);
    // wl.writeLine(2, `public readonly create: typeof create = create;`);
    wl.writeLine(2, this.writeFromStream(wl.wr));
    wl.writeLine(2, this.writeCreateFunction(wl.wr));
    wl.writeLine(2, this.writeFilterFunction(wl.wr));
    wl.writeLine(2, this.writeToStream(wl.wr));
    wl.writeLine(2, `constructor(props?: {`);
    wl.writeLine(3, `initial?: Partial<Type>`);
    wl.writeLine(2, `}) {`);
    wl.writeLine(3, `const initial = (props || {}).initial;`);
    wl.writeLine(3, `this.givenInitial = this.coerce(initial);`);
    wl.writeLine(3, `this.initial = this.create(initial);`);
    wl.writeLine(2, `}\n`);
    wl.writeLine(1, `}\n`);
  }
  // private createType<B>({
  //   level,
  //   wr,
  //   aname,
  //   vname,
  //   def,
  // }: {
  //   level: number;
  //   wr: TSWriter;
  //   aname: string;
  //   vname: string;
  //   def: Definition.Types.Type<B>;
  // }): string {
  //   switch (def.type) {
  //     case Definition.Types.Char.type:
  //     case Definition.Types.Boolean.type:
  //     case Definition.Types.Uint8.type:
  //     case Definition.Types.Uint16.type:
  //     case Definition.Types.Short.type:
  //     case Definition.Types.Uint32.type:
  //     case Definition.Types.Int.type:
  //     case Definition.Types.Float.type:
  //     case Definition.Types.Double.type:
  //       return `Definition.Types.${def.type}.create(...args.map(i => i.${vname}))`;
  //     case Definition.Types.Uint64.type:
  //     case Definition.Types.Long.type:
  //       return `Definition.Types.HighLow.create(${aname}, ${initialValue(wr, vname, def)})`;
  //     case Definition.Types.Struct.type:
  //       const sdef = def as Definition.Types.TypeNameAttribute<B>;
  //       return `${sdef.name}.create(${aname}, ${vname})`;
  //     case Definition.Types.FixedCString.type:
  //       const scdef = (def as unknown) as Definition.Types.FixedCString;
  //       return `Definition.Types.${def.type}.create(${scdef.length}, ${aname}, ${initialValue(
  //         wr,
  //         vname,
  //         def,
  //       )})`;
  //     case Definition.Types.FixedArray.type:
  //       const adef = (def as unknown) as Definition.Types.ArrayTypeAttribute<B>;
  //       return `Definition.Types.${def.type}.create(${adef.length}, (idx${level}) => ${this.createType(
  //         {
  //           level: level + 1,
  //           wr,
  //           aname: `(${aname} || ${initialValue(wr, vname, def)})[idx${level}]`,
  //           vname: 'YYYY',
  //           def: adef.element,
  //         },
  //       )})`;
  //     default:
  //       throw Error(`writeReflection failed for: ${type}`);
  //   }
  // }
  // private getArrayLengths<B>(def: Definition.Types.Type<B>, ret = ''): string {
  //   if (def.type === Definition.Types.FixedArray.type) {
  //     if (ret.length) {
  //       ret += ', ';
  //     }
  //     const adef = (def as unknown) as Definition.Types.ArrayTypeAttribute<B>;
  //     ret += `${adef.length}`;
  //     return this.getArrayLengths(adef.element, ret);
  //   }
  //   return ret;
  // }
  // private writeCreateAttribute<B>(
  //   level: number,
  //   attr: Definition.Types.Type<B>,
  //   vname: string,
  // ): string {
  //   switch (Definition.Types.toAttributeType(attr)) {
  //     case Definition.Types.AttributeType.Scalar:
  //       return `Definition.Types.${attr.type}.create(${vname})`;
  //     case Definition.Types.AttributeType.FixedArray:
  //       const adef = (attr as unknown) as Definition.Types.ArrayTypeAttribute<B>;
  //       if (adef.type === Definition.Types.FixedCString.type) {
  //         return `Definition.Types.${attr.type}.create(${adef.length}, ${vname})`;
  //       } else {
  //         return `Definition.Types.${attr.type}.create([${this.getArrayLengths(adef)}], ${vname})`;
  //       }
  //     case Definition.Types.AttributeType.Struct:
  //       const sdef = (attr as unknown) as Definition.Types.Struct;
  //       return `${sdef.name}.create(${vname})`;
  //   }
  // }
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
  private writeFilterFunction(wr: TSWriter) {
    const wl = new TSWriteLine(wr);
    wl.writeLine(0, 'public coerce(val?: Partial<Type>): __Definition.Utils.Option<Partial<Type>> {');
    wl.writeLine(1, 'let ret: __Definition.Utils.Option<Partial<MutableType>> = __Definition.Utils.NoneOption;');
    this.def.bits.forEach(i => {
      wl.writeLine(2, `if (['boolean', 'number'].includes(typeof val.${i.name})) {`);
      wl.writeLine(3, `ret = __Definition.Utils.isNone(ret) ? __Definition.Utils.SomeOption<Partial<MutableType>>({}) : ret;`);
      wl.writeLine(3, `ret.some.${i.name} = ${i.length === 1 ? '!!' : ''}val.${i.name};`);
      wl.writeLine(2, `}`);
    });
    wl.writeLine(1, 'return ret;');
    wl.writeLine(0, '}');

    return wl.toString();
  }

  private writeCreateFunction(wr: TSWriter) {
    const wl = new TSWriteLine(wr);
    /// wl.writeLine(0, 'export function create(...rargs: Partial<Type>[]): Type {');
    wl.writeLine(0, 'public create(...rargs: Partial<Type>[]): Type {');
    wl.writeLine(1, `const data = rargs`);
    wl.writeLine(2, `.concat([__Definition.Utils.OrUndefined(this.givenInitial)])`);
    wl.writeLine(2, `.filter(i => typeof i === 'object').reduce((r, i) => {`);
    this.def.bits.forEach(i => {
      wl.writeLine(3, `if (['boolean', 'number'].includes(typeof i.${i.name})) {`);
      wl.writeLine(4, `r.${i.name}.push(${i.length === 1 ? '!!' : ''}i.${i.name});`);
      wl.writeLine(3, `}`);
    });
    wl.writeLine(2, 'return r;');
    wl.writeLine(1, `}, {`);
    this.def.bits.forEach(i => {
      wl.writeLine(2, `${i.name}: [],`);
    });
    wl.writeLine(1, '});');
    wl.writeLine(1, `return {`);
    this.def.bits.forEach(attr => {
      wl.writeLine(
        2,
        `${attr.name}: Definition.BitsByName.${attr.name}.type.create(...data.${attr.name}),`
      );
    });
    wl.writeLine(1, `};`);
    wl.writeLine(0, '}');
    return wl.toString();
  }
  // public fromStreamAction<B>(level: number, wr: TSWriter, def: Definition.Types.Type<B>): string {
  //   switch (Definition.Types.toAttributeType(def)) {
  //     case Definition.Types.AttributeType.Scalar:
  //       return `nrb.read${def.type}()`;
  //     case Definition.Types.AttributeType.Struct:
  //       const sdef = def as Definition.Types.TypeNameAttribute<B>;
  //       return `${sdef.name}.fromStream(nrb.sbuf)`;
  //     case Definition.Types.AttributeType.FixedArray:
  //       const adef = (def as unknown) as Definition.Types.ArrayTypeAttribute<B>;
  //       return `Runtime.Types.${def.type}.fromStream(${
  //         adef.length
  //       }, (idx${level}) => ${this.fromStreamAction(level + 1, wr, adef.element)})`;
  //   }
  //   // throw Error(`fromStreamAction: ${type.type}`);
  // }
  private writeFromStream(wr: TSWriter) {
    const wl = new TSWriteLine(wr);
    wl.writeLine(0, 'public static fromStream(rb: __Runtime.StreamBuffer): Type {');
    wl.writeLine(
      1,
      `return rb.prepareRead(${wl.wr.quote(this.def.name)}, ${this.def.bytes}, (nrb) => {`,
    );

    wl.writeLine(
      2,
      Array(this.def.bytes)
        .fill(undefined)
        .reduce((r, _, i, a) => {
          return `${r} (nrb.readUint8() << ${i * 8})${i + 1 == a.length ? ';' : ' |\n'}`;
        }, 'let _32bit = '),
    );
    wl.writeLine(2, 'return {');
    this.def.bits.forEach(i => {
      // tslint:disable-next-line: max-line-length
      wl.writeLine(
        3,
        `${i.name}: ${i.length == 1 ? '!!' : ''}((_32bit >> ${i.start}) & ${2 ** i.length - 1}),`,
      );
    });
    wl.writeLine(2, '};');
    wl.writeLine(1, '});');
    wl.writeLine(0, '}');
    return wl.toString();
  }
  // private toStreamAction<B>(
  //   level: number,
  //   wr: TSWriter,
  //   aname: string,
  //   def: Definition.Types.Type<B>,
  // ): string {
  //   switch (Definition.Types.toAttributeType(def)) {
  //     case Definition.Types.AttributeType.Scalar:
  //       return `nwb.write${def.type}(${aname})`;
  //     case Definition.Types.AttributeType.Struct:
  //       const sdef = def as Definition.Types.TypeNameAttribute<B>;
  //       return `${sdef.name}.toStream(${aname}, nwb.sbuf)`;
  //       break;
  //     case Definition.Types.AttributeType.FixedArray:
  //       const adef = (def as unknown) as Definition.Types.ArrayTypeAttribute<B>;
  //       return `Runtime.Types.${def.type}.toStream(${
  //         adef.length
  //       }, (idx${level}) => ${this.toStreamAction(
  //         level + 1,
  //         wr,
  //         `(${aname} || [])[idx${level}]`,
  //         adef.element,
  //       )})`;
  //   }
  // }
  private writeToStream(wr: TSWriter) {
    const wl = new TSWriteLine(wr);
    wl.writeLine(0, 'public value32bit(data: Type): number {');
    this.def.bits.reduce((pipe, i, idx, bits) => {
      wl.writeLine(
        1,
        `${pipe}((~~(data.${i.name}) & ${2 ** i.length - 1}) << ${i.start})${
          idx === bits.length - 1 ? ';' : ''
        }`,
      );
      return '| ';
    }, 'return ');
    wl.writeLine(0, '}');
    wl.writeLine(0, '');
    wl.writeLine(0, 'public toStream(data: Partial<Type>,');
    wl.writeLine(1, 'wb: __Runtime.StreamBuffer): __Runtime.StreamBuffer {');
    wl.writeLine(
      1,
      `return wb.prepareWrite(${wl.wr.quote(this.def.name)}, ${this.def.bytes}, (nwb) => {`,
    );
    wl.writeLine(2, 'const _32bit = this.value32bit(this.create(data));');
    for (let i = 0; i < this.def.bytes; ++i) {
      wl.writeLine(2, `nwb.writeUint8((_32bit >> ${i * 8}) & 0xff);`);
    }
    wl.writeLine(1, '});');
    wl.writeLine(0, '}');
    return wl.toString();
  }

  public write(wr: TSWriter): TSWriteLine {
    const wl = new TSWriteLine(wr);
    wl.writeLine(0, `export namespace ${this.def.name} {`);
    this.writeType(wl);
    // this.writeBits(wl);
    // this.writeCreateFunction(wl);
    this.writeBitsByName(wr, wl);
    this.writeDefinition(wl);
    // writeCloneFunction(wl);
    // this.writeFromStream(wl);
    // this.writeToStream(wl);
    wl.writeLine(0, '}');
    this.imports.prepend(wl, this.def);
    return wl;
  }
}
