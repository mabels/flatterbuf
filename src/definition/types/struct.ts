import { Option, SomeOption, NoneOption, OrUndefined, isSome, isNone } from '../optional';
import { Definition as Type, TypeName, NamedType } from './type';
import { Funcs, funcsMapper } from '../align';
import { StreamBuffer } from '../stream-buffer';
// import { Runtime } from '../../runtime';

export interface BaseAttribute {
  readonly name: string;
  // readonly notRequired?: boolean;
}

export interface Attribute<T> extends BaseAttribute {
  // readonly initial?: T;
  readonly type: Type<T>;
}

export interface AttributeOfs<T> extends Attribute<T> {
  readonly ofs: number;
}

export type StructInitial = Record<string, any>;
export type StructByName = Record<string, AttributeOfs<any>>;
export type StructMerge = Record<string, unknown[]>;

export interface StructArg {
  readonly name: string;
  readonly alignFuncs?: Partial<Funcs<string>>;
  readonly attributes: Attribute<unknown>[];
  readonly initial?: StructInitial;
}

export class Definition implements NamedType<StructInitial> {
  public static readonly type: TypeName = 'Struct';
  public readonly type: TypeName = Definition.type;
  public readonly bytes: number;
  public readonly name: string;
  public readonly alignFuncs: Funcs<string>;
  public readonly attributes: AttributeOfs<any>[];
  public readonly attributeByName: StructByName;

  // public initial: StructInitial;
  public givenInitial: Option<Partial<StructInitial>>;
  // Type(typelevel)
  public constructor(st: StructArg) {
    this.name = st.name;
    const al = funcsMapper(st.alignFuncs);
    this.alignFuncs = al.names;

    const tmp = st.attributes.reduce(
      (res, attr) => {
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
        attributesInclOfs: [] as AttributeOfs<any>[],
      },
    );
    this.bytes = al.funcs.overall(tmp.bytes);
    this.attributes = tmp.attributesInclOfs;
    this.attributeByName = this.attributes.reduce((r, attr) => {
      r[attr.name] = attr;
      return r;
    }, {} as StructByName);
    // this.attributes.forEach((attr) => {
    //   if (givenInitial.hasOwnProperty(attr.name)) {
    //     this.initial[attr.name] = attr.type.create(
    //       givenInitial[attr.name],
    //       attr.initial,
    //       attr.type.initial,
    //     );
    //     if (isNone(this.givenInitial)) {
    //       this.givenInitial = SomeOption({});
    //     }
    //     if (isSome(this.givenInitial)) {
    //       this.givenInitial.some[attr.name] = givenInitial[attr.name];
    //     }
    //   }
    // });
    this.givenInitial = this.coerce(st.initial);
    // this.initial = this.create(st.initial);
  }

  public coerce(vals: Record<string, any>): Option<Record<string, any>> {
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
        (r, val) => {
          this.attributes.forEach((attr) => {
            const m = attr.type.coerce(val[attr.name]);
            if (isSome(m)) {
              r[attr.name].push(m.some);
            }
          });
          return r;
        },
        this.attributes.reduce((r, attr) => {
          r[attr.name] = [];
          return r;
        }, {} as Record<string, any[]>),
      );
    // console.log(`YYYYY`, data, this.bits);
    return this.attributes.reduce((r, attr) => {
      r[attr.name] = attr.type.create(...data[attr.name]);
      // console.log(`XXXXXX`, bit.name, r[bit.name], data[bit.name]);
      return r;
    }, {} as StructInitial);
    // const data: StructMerge = vals
    //   .concat([this.initial])
    //   .filter((i) => typeof i === 'object')
    //   .reduce(
    //     (ret, val) => {
    //       this.attributes.forEach((attr) => {
    //         const v = val[attr.name];
    //         if (v !== undefined) {
    //           ret[attr.name].push(v);
    //         }
    //       });
    //       return ret;
    //     },
    //     this.attributes.reduce((r, attr) => {
    //       r[attr.name] = [];
    //       return r;
    //     }, {} as StructMerge),
    //   );

    // // console.log(`XXXXXXX=>${JSON.stringify(initials)}, ${JSON.stringify(items)}`);
    // return this.attributes.reduce((ret, attr) => {
    //   const inits = data[attr.name];
    //   if (Definition.Types.isFixedCString(attr.type)) {
    //     const scdef = (attr.type as unknown) as Definition.Types.FixedCString;
    //     ret[attr.name] = scdef.create(...(inits as FixedCStringInitType[]));
    //   } else if (Definition.Types.isFixedArray(attr.type)) {
    //     const adef = (attr.type as unknown) as Definition.Types.FixedArray<unknown>;
    //     ret[attr.name] = adef.create(...(inits as unknown[][]));
    //   } else if (Definition.Types.isScalar(attr.type) || Definition.Types.isStruct(attr.type)) {
    //     const sdef = (attr.type as unknown) as Definition.Types.Type<unknown>;
    //     ret[attr.name] = sdef.create(...inits);
    //   } else {
    //     throw Error(`Unknown attribute ${attr}`);
    //   }
    //   return ret;
    // }, {} as StructInitial);
  }

  public toStream(data: Partial<StructInitial>, wb: StreamBuffer): StreamBuffer {
    throw Error('not implemented in base Class');
  }
}

export type Struct = Definition;