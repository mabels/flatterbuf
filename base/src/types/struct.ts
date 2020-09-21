import { Option, SomeOption, NoneOption, OrUndefined, isSome, isNone } from '../optional';
import { Definition as Base, TypeName, NamedType } from './base';
import { Funcs, funcsMapper } from '../align';
import { ChunkBuffer } from '../stream-buffer';

export interface BaseAttribute {
  readonly name: string;
}

export interface Attribute<T> extends BaseAttribute {
  readonly type: Base<T>;
}

export interface AttributeOfs<T> extends Attribute<T> {
  readonly ofs: number;
}

export type StructInitial = Record<string, unknown>;
export type StructByName = Record<string, AttributeOfs<unknown>>;
export type StructMerge = Record<string, unknown[]>;

export interface StructArg {
  readonly name: string;
  readonly alignFuncs?: Partial<Funcs<string>>;
  readonly attributes: Attribute<unknown>[];
  readonly initial?: StructInitial;
}

export const typeName: TypeName = 'Struct';

export abstract class AbstractDefinition extends NamedType<StructInitial> {
  public readonly type: TypeName = typeName;
  public abstract readonly bytes: number;
  public abstract readonly name: string;
  public abstract readonly alignFuncs: Funcs<string>;
  public abstract readonly attributes: AttributeOfs<unknown>[];
  public abstract readonly attributeByName: StructByName;
  public abstract readonly givenInitial: Option<Partial<StructInitial>>;
}

export class Definition extends AbstractDefinition {
  public static readonly type: TypeName = typeName;
  public readonly bytes: number;
  public readonly name: string;
  public readonly alignFuncs: Funcs<string>;
  public readonly attributes: AttributeOfs<unknown>[];
  public readonly attributeByName: StructByName;
  public readonly givenInitial: Option<Partial<StructInitial>>;

  // Type(typelevel)
  public constructor(st: StructArg) {
    super();
    this.name = st.name;
    const al = funcsMapper(st.alignFuncs);
    this.alignFuncs = al.names;

    const tmp = st.attributes.reduce(
      (res, attr) => {
        // Hack
        res.attributesInclOfs.push({
          ...attr,
          // notRequired: !!attr.notRequired,
          ofs: res.bytes,
        });
        res.bytes = res.bytes + al.funcs.element(attr.type.bytes);
        return res;
      },
      {
        bytes: 0,
        attributesInclOfs: [] as AttributeOfs<unknown>[],
      },
    );
    this.bytes = al.funcs.overall(tmp.bytes);
    this.attributes = tmp.attributesInclOfs;
    this.attributeByName = this.attributes.reduce((r, attr) => {
      r[attr.name] = attr;
      return r;
    }, {} as StructByName);
    this.givenInitial = this.coerce(st.initial);
  }

  public coerce(vals: Record<string, unknown>): Option<Record<string, unknown>> {
    let ret: Option<StructInitial> = NoneOption;
    if (typeof vals === 'object') {
      this.attributes.forEach((attr) => {
        const val = attr.type.coerce(vals[attr.name]);
        if (isSome(val)) {
          if (isNone(ret)) {
            ret = SomeOption({});
          }
          ret.some[attr.name] = val.some;
        }
      });
    }
    return ret;
  }

  public create(...rargs: StructInitial[]): StructInitial {
    const data = rargs
      .concat(OrUndefined(this.givenInitial))
      .filter((i) => isSome(this.coerce(i)))
      .reduce(
        (r: Record<string, unknown[]>, val) => {
          this.attributes.forEach((attr) => {
            const m = attr.type.coerce(val[attr.name]);
            if (isSome(m)) {
              r[attr.name].push(m.some as unknown);
            }
          });
          return r;
        },
        this.attributes.reduce((r, attr) => {
          r[attr.name] = [];
          return r;
        }, {} as Record<string, unknown[]>),
      );
    return this.attributes.reduce((r, attr) => {
      r[attr.name] = attr.type.create(...(data[attr.name] as unknown[]));
      return r;
    }, {} as StructInitial);
  }

  // we need this defined in the class not in the prototype
  // tslint:disable-next-line: typedef
  public fromStreamChunk = function (
    _chunk: ChunkBuffer,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _name: string = this.type,
  ): Record<string, unknown> {
    throw new Error('Method not implemented.');
  };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public toStreamChunk(_val: Record<string, unknown>, _chunk: ChunkBuffer): void {
    throw new Error('Method not implemented.');
  }
}

export type Struct = Definition;
