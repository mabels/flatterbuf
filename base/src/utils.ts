import { Option, NoneOption, SomeOption, isSome } from './optional';

function nestedAssignObject(field: string | undefined, target: unknown, without: unknown[]) {
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
    const my: Record<string, any> = target;
    theTarget = my[field] = my[field] || ({} as any);
  }
  // console.log(out);
  Object.entries(out).reduce((r, [key, args]) => {
    nestedAssign(key, r, ...args);
    return r;
  }, theTarget);
  return SomeOption(target);
}

function nestedAssignArray(field: string | undefined, target: unknown, without: unknown[]) {
  if (!without.length) {
    return NoneOption;
  }
  let found = false;
  let theTarget: unknown[] = [];
  if (field !== undefined && typeof target === 'object') {
    const my: Record<string, any> = target;
    theTarget = my[field] = my[field] || theTarget;
  } else if (Array.isArray(target)) {
    theTarget = target;
  }
  const tmp = (without as unknown[][]).reverse().reduce((ret, arr) => {
    arr.forEach((item, idx) => {
      if (item === undefined) {
        return;
      }
      const o = nestedAssign(undefined, ret[idx] || {}, item);
      if (isSome(o)) {
        ret[idx] = o.some;
        found = true;
      }
    });
    return ret;
  }, theTarget);
  return found ? SomeOption(tmp) : NoneOption;
}

export function nestedAssign<T>(
  field: string | undefined,
  target: unknown,
  ...os: unknown[]
): Option<unknown> {
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
    const my: Record<string, any> = target;
    my[field] = without[0] as T;
    return SomeOption(target);
  } else {
    if (without[0] != undefined) {
      return SomeOption(without[0]);
    }
    return NoneOption;
  }
}
