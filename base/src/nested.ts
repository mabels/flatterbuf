export type NestedPartial<T> = {
  [P in keyof T]?: NestedPartial<T[P]>;
};

export type NestedReadonly<T> = {
  readonly [P in keyof T]: NestedReadonly<T[P]>;
};
