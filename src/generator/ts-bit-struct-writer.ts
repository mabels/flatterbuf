import { Types } from '../definition';
import { TSWriteLine, TSWriterArgs, TSWriter, TSRefWriter, tsStringify } from './ts';
import { TSImports } from './ts-imports';
import { isSome } from '../definition/optional';

export class TSBitStructWriter<T> implements TSRefWriter {
  public readonly fname: string;
  private readonly imports: TSImports<T>;
  constructor(public readonly def: Types.BitStruct.Definition, public readonly args: TSWriterArgs) {
    this.imports = new TSImports(args);
    this.fname = `${args.generationPath}${this.def.name.toLowerCase()}`;
  }

  private writeType(wl: TSWriteLine) {
    wl.writeLine(1, `export interface MutableType {`);
    this.def.bits.forEach((i) => {
      wl.writeLine(2, `${i.name}: ${i.length > 1 ? 'number' : 'boolean'};`);
    });
    wl.writeLine(1, '}');
    wl.writeLine(1, 'export type Type = Readonly<MutableType>;');
    wl.writeLine(1, 'export type ValueType = Readonly<MutableType>;');
  }

  private writeBitItem(asType: boolean, wr: TSWriter, bit: Types.BitStruct.BitItemWithLength) {
    const wl = new TSWriteLine(wr);
    wl.writeLine(1, `${bit.name}: {`);
    wl.writeLine(2, `name: ${wr.quote(bit.name)},`);
    wl.writeLine(2, `start: ${bit.start},`);
    wl.writeLine(2, `length: ${bit.length},`);
    const typName = `Types.${bit.length === 1 ? 'Boolean' : 'Uint32'}.Definition`;
    if (asType) {
      wl.writeLine(2, `type: ${typName};`);
    } else {
      let initVal = '';
      if (isSome(bit.type.givenInitial)) {
        initVal = `{ initial: ${bit.type.givenInitial.some} }`;
      }
      wl.writeLine(2, `type: new ${typName}(${initVal})`);
    }
    wl.writeLine(1, `}${asType ? ';' : ','}`);
    return wl.toString();
  }

  private writeStaticGivenInitial(wr: TSWriter) {
    const wl = new TSWriteLine(wr);
    wl.write(0, `public static readonly givenInitial: Optional.Option<NestedPartial<Type>>`);
    if (isSome(this.def.givenInitial)) {
      wl.writeLine(
        0,
        ` = Optional.SomeOption(${tsStringify(this.def.givenInitial.some, this.def, wr)});`,
      );
    } else {
      wl.writeLine(0, ' = Optional.NoneOption;');
    }
    return wl.toString();
  }

  private writeBits(wr: TSWriter) {
    const wl = new TSWriteLine(wr);
    wl.writeLine(0, `public static readonly BitsByName: BitsByName = {`);
    this.def.bits.forEach((bit) => {
      wl.writeLine(1, this.writeBitItem(false, wr, bit));
    });
    wl.writeLine(0, `};\n`);
    wl.writeLine(0, `public static readonly Bits: Types.BitStruct.BitItemWithLength[] = [`);
    this.def.bits.forEach((bit) => {
      wl.writeLine(1, `Definition.BitsByName.${bit.name},`);
    });
    wl.writeLine(0, '];');
    wl.writeLine(0, this.writeStaticGivenInitial(wl.wr));
    return wl.toString();
  }

  private writeBitsByName(wr: TSWriter, wl: TSWriteLine) {
    wl.writeLine(1, '\nexport interface BitsByName extends Types.BitStruct.BitsByName {');
    this.def.bits.forEach((bit) => {
      wl.writeLine(2, this.writeBitItem(true, wr, bit));
    });
    wl.writeLine(1, '}');
  }

  private writeDefinition(wl: TSWriteLine) {
    wl.writeLine(1, `\nexport class Definition extends Types.BitStruct.AbstractDefinition {`);
    wl.writeLine(2, this.writeBits(wl.wr));
    wl.writeLine(2, `public readonly type: Types.Base.TypeName = Types.BitStruct.Definition.type;`);
    wl.writeLine(2, `public readonly name: string = '${this.def.name}';`);
    wl.writeLine(2, `public readonly length: number = ${this.def.length};`);
    wl.writeLine(2, `public readonly bytes: number = ${this.def.bytes};`);
    wl.writeLine(
      2,
      `public readonly alignFuncs: Align.Funcs<string> = { element: ${wl.wr.quote(
        this.def.alignFuncs.element,
      )}, overall: ${wl.wr.quote(this.def.alignFuncs.overall)} };`,
    );
    wl.writeLine(2, `public readonly bits: typeof Definition.Bits = Definition.Bits;`);
    wl.writeLine(
      2,
      `public readonly bitsByName: typeof Definition.BitsByName = Definition.BitsByName;`,
    );
    wl.writeLine(2, `public readonly givenInitial: Optional.Option<Partial<Type>>;\n`);
    wl.writeLine(2, this.writeCreateFunction(wl.wr));
    wl.writeLine(2, this.writeFilterFunction(wl.wr));
    wl.writeLine(2, this.writeToStream(wl.wr));
    wl.writeLine(2, this.writeFromStream(wl.wr));
    wl.writeLine(2, `constructor(props?: {`);
    wl.writeLine(3, `initial?: Partial<Type>`);
    wl.writeLine(2, `}) {`);
    wl.writeLine(3, `super();`);
    wl.writeLine(3, `const my = (props || {}).initial;`);
    wl.writeLine(3, `this.givenInitial = Utils.nestedAssign(undefined, {},`);
    wl.writeLine(4, `Optional.OrUndefined(this.coerce(my)),`);
    wl.writeLine(4, `Optional.OrUndefined(Definition.givenInitial));`);
    wl.writeLine(2, `}\n`);
    wl.writeLine(1, `}\n`);
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
  private writeFilterFunction(wr: TSWriter) {
    const wl = new TSWriteLine(wr);
    wl.writeLine(0, 'public coerce(ival?: Partial<Type>): Optional.Option<Partial<Type>> {');
    wl.writeLine(1, 'const val = ival || {};');
    wl.writeLine(1, 'let ret: Optional.Option<Partial<MutableType>> = Optional.NoneOption;');
    this.def.bits.forEach((i) => {
      wl.writeLine(2, `if (['boolean', 'number'].includes(typeof val.${i.name})) {`);
      wl.writeLine(
        3,
        `ret = Optional.isNone(ret) ? Optional.SomeOption<Partial<MutableType>>({}) : ret;`,
      );
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
    wl.writeLine(2, `.concat([Optional.OrUndefined(this.givenInitial)])`);
    wl.writeLine(2, `.filter(i => typeof i === 'object').reduce((r, i) => {`);
    this.def.bits.forEach((i) => {
      wl.writeLine(3, `if (['boolean', 'number'].includes(typeof i.${i.name})) {`);
      wl.writeLine(4, `r.${i.name}.push(${i.length === 1 ? '!!' : ''}i.${i.name});`);
      wl.writeLine(3, `}`);
    });
    wl.writeLine(2, 'return r;');
    wl.writeLine(1, `}, {`);
    this.def.bits.forEach((i) => {
      wl.writeLine(2, `${i.name}: [],`);
    });
    wl.writeLine(1, '});');
    wl.writeLine(1, `return {`);
    this.def.bits.forEach((attr) => {
      wl.writeLine(
        2,
        `${attr.name}: Definition.BitsByName.${attr.name}.type.create(...data.${attr.name}),`,
      );
    });
    wl.writeLine(1, `};`);
    wl.writeLine(0, '}');
    return wl.toString();
  }

  private writeFromStream(wr: TSWriter) {
    const wl = new TSWriteLine(wr);
    wl.writeLine(0, 'public fromStreamChunk(nrb: ChunkBuffer, name: string = this.name): Type {');
    wl.writeLine(
      1,
      Array(this.def.bytes)
        .fill(undefined)
        .reduce((r, _, i, a) => {
          return `${r} (nrb.readUint8() << ${i * 8})${i + 1 == a.length ? ';' : ' |\n'}`;
        }, 'let _32bit = '),
    );
    wl.writeLine(1, 'return {');
    this.def.bits.forEach((i) => {
      // tslint:disable-next-line: max-line-length
      wl.writeLine(
        2,
        `${i.name}: ${i.length == 1 ? '!!' : ''}((_32bit >> ${i.start}) & ${2 ** i.length - 1}),`,
      );
    });
    wl.writeLine(1, '};');
    wl.writeLine(0, '}');
    wl.writeLine(0, '');
    return wl.toString();
  }

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
    wl.writeLine(
      0,
      'public toStreamChunk(data: Partial<Type>, nwb: ChunkBuffer, name: string = this.name): void {',
    );
    wl.writeLine(1, 'const _32bit = this.value32bit(this.create(data));');
    for (let i = 0; i < this.def.bytes; ++i) {
      wl.writeLine(1, `nwb.writeUint8((_32bit >> ${i * 8}) & 0xff);`);
    }
    wl.writeLine(0, '}');
    return wl.toString();
  }

  public write(wr: TSWriter): TSWriteLine {
    const wl = new TSWriteLine(wr);
    wl.writeLine(0, `export namespace ${this.def.name} {`);
    this.writeType(wl);
    this.writeBitsByName(wr, wl);
    this.writeDefinition(wl);
    wl.writeLine(0, '}');
    this.imports.prepend(wl, this.def);
    return wl;
  }
}
