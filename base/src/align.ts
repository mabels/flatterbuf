export interface Funcs<A> {
  readonly element: A;
  readonly overall: A;
}
export type Func = (a: number) => number;

export function Byte(a: number): number {
  return a;
}
export function TwoByte(a: number): number {
  return a + (a % 2);
}
export function FourByte(a: number): number {
  return a + (a % 4);
}
export function EightByte(a: number): number {
  return a + (a % 8);
}
export const Functions: { [id: string]: Func } = {
  byte: Byte,
  twobyte: TwoByte,
  fourbyte: FourByte,
  EightByte: EightByte,
};

export interface FuncAndName {
  name: string;
  func: Func;
}
export interface FuncNames {
  readonly names: Funcs<string>;
  readonly funcs: Funcs<Func>;
}

export function funcsMapper(funcs?: Partial<Funcs<string>>): FuncNames {
  const element = funcMapper((funcs || {}).element);
  const overall = funcMapper((funcs || {}).overall);
  return {
    names: {element: element.name, overall: overall.name},
    funcs: {element: element.func, overall: overall.func},
  };
}

export function funcMapper(a?: string): FuncAndName {
  const fname = (a || '').toLowerCase();
  const fn = Functions[fname];
  if (fn) {
    return {name: fname, func: fn};
  }
  return {name: 'byte', func: Byte};
}

export function funcName(name?: string): string {
  return funcMapper(name).name;
}

export function func(name?: string): Func {
  return funcMapper(name).func;
}
