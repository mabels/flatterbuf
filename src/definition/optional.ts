export type NestedPartial<T> = {
  [P in keyof T]?: NestedPartial<T[P]>;
};
export interface SomeType<T> {
  readonly none: false;
  readonly some: T;
}
export function SomeOption<T>(t: T): SomeType<T> {
  return {
    none: false,
    some: t,
  };
}

export interface NoneType {
  readonly none: true;
}

export const NoneOption: NoneType = {
  none: true,
};

export type Option<T> = SomeType<T> | NoneType;

export function isNone<T>(m: Option<T>): m is NoneType {
  return m.none ? true : false;
}
export function isSome<T>(m: Option<T>): m is SomeType<T> {
  return m.none ? false : true;
}
export function OrUndefined<T>(m: Option<T>): T | undefined {
  return isSome(m) ? m.some : undefined;
}
