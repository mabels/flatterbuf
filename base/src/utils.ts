import { Option, NoneOption, SomeOption, isSome } from './optional';

function nestedAssignObject<T>(field: string | undefined, target: T, without: T[]): Option<T> {
  let found = false;
  const out = without
    .map((i) => Object.entries(i))
    .reduce((r, entries) => {
      entries.forEach((entry) => {
        const key = entry[0];
        const ival = entry[1];
        let val: unknown[] = r[key];
        if (val === undefined) {
          val = [];
          r[key] = val;
        }
        if (eval !== undefined) {
          found = true;
          val.push(ival);
        }
      });
      return r;
    }, {} as Record<string, unknown[]>);
  if (!found) {
    return NoneOption;
  }
  let theTarget = target;
  if (field !== undefined) {
    const my: Record<string, T> = target as unknown as Record<string, T>;
    theTarget = my[field] = my[field] || ({} as T);
  }
  // console.log(out);
  Object.entries(out).reduce((r, [key, args]) => {
    nestedAssign(key, r, ...args);
    return r;
  }, theTarget);
  return SomeOption(target);
}

function nestedAssignArray<T>(
  field: string | undefined,
  target: T | undefined,
  without: T[]): Option<T> {
  if (!without.length) {
    return NoneOption;
  }
  // console.log("target:", target)
  // console.log("without:", without)
  let theTarget: T = [] as unknown as T;
  if (field !== undefined && typeof target === 'object') {
    const my: Record<string, T> = target as unknown as Record<string, T>;
    theTarget = my[field] = my[field] || ([] as unknown as T);
  } else if (Array.isArray(target)) {
    theTarget = target;
  }
  let found = false;
  const tmp = without.reverse().reduce((ret, arr) => {
    (arr as unknown as never[]).forEach((item, idx) => {
      if (item === undefined) {
        return;
      }
      const my = ret as unknown as (keyof typeof ret)[];
      const o = nestedAssign(undefined, my[idx] || ({} as unknown as (keyof typeof ret)), item);
      if (isSome(o)) {
        my[idx] = o.some;
        found = true;
      }
    });
    return ret;
  }, theTarget);
  return found ? SomeOption(tmp) : NoneOption;
}

export function nestedAssign<T>(
  field: string | undefined,
  target: T,
  ...os: T[]
): Option<T> {
  if (!os.length) {
    return NoneOption;
  }
  const without = os.filter((i) => i !== undefined);
  const type = without.reduce(
    (r, v) => {
      return r === (Array.isArray(v) ? 'array' : typeof v) ? r : 'notuniform';
    },
    Array.isArray(without[0]) ? 'array' : typeof without[0],
  );
  if (type === 'notuniform') {
    throw Error('assignable Type has to be unified');
  }
  if (type === 'object') {
    return nestedAssignObject(field, target, without);
  }
  if (type === 'array') {
    return nestedAssignArray(field, target, without);
  }
  if (type === 'undefined') {
    return NoneOption;
  }
  if (field !== undefined && typeof target === 'object') {
    const my: Record<string, unknown> = target as Record<string, unknown>;
    my[field] = without[0] as T;
    return SomeOption(target);
  } else {
    if (without[0] != undefined) {
      return SomeOption(without[0]);
    }
    return NoneOption;
  }
}
