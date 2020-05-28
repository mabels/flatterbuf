import { Option, NoneOption, SomeOption  } from './optional';

export function nestedAssign<T>(
  field: string | undefined,
  target: Record<string, T>,
  ...os: (T | Partial<T>)[]
): Option<Record<string, T>> {
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
    let found = false;
    // console.log(`without: ${JSON.stringify(without)}`);
    const out = without
      .map((i) => Object.entries(i))
      .reduce((r, entries) => {
        entries.forEach((entry) => {
          const key = entry[0];
          const ival = entry[1];
          // console.log(`key: ${entry}, ${key}, ${ival}`);
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
      theTarget = target[field] = target[field] || {} as any;
    }
    // console.log(out);
    Object.entries(out).reduce((r, [key, args]) => {
        nestedAssign(key, r, ...args);
        // console.log(`key:${key}, args:${args}:field:${field}:theTarget:${JSON.stringify(theTarget)}:target:${JSON.stringify(target)}`);
        return r;
    }, theTarget);
    return SomeOption(target);

    // nestedAssign(entry[0], r[entry[0]] || {}, entry[1]);
    //             const mval = r[entry[0]]; // test if need merge
    //             const valType = typeof mval;
    //             if (Array.isArray(valType)) {
    //                 return;
    //             }
    //             if (valType === 'object') {
    //                 return;
    //             }
    // return NoneOption;
  }
  if (type === 'array') {
    return NoneOption;
  }
  if (type === 'undefined') {
    return NoneOption;
  }
  target[field] = without[0] as T;
  return SomeOption(target);
}

// export function nestedAssign(...os: Option<Record<string, unknown>>[]): Option<Record<string, unknown>> {
//     const somes = os.filter(i => isSome(i)).map(i  => (i as SomeType<unknown>).some).reverse();
//     let found = false;
//     const ret: Record<string, unknown> = somes.reduce((r: Record<string, unknown>, val) => {
//         Object.entries(val).forEach(entry => {
//             const mval = r[entry[0]]; // test if need merge
//             const valType = typeof mval;
//             if (Array.isArray(valType)) {
//                 return;
//             }
//             if (valType === 'object') {
//                 return;
//             }
//             found = true;
//             if (Array.isArray(entry[1])) {
//                 r[entry[0]] = entry[1].map(i => OrUndefined(
//                 ));
//                 return;
//             } else if (typeof entry[1] === 'object') {
//                 const a = nestedAssign(SomeOption(entry[1]));
//                 if (isSome(a)) {
//                     r[entry[0]] = a.some;
//                 }
//             } else {
//                 r[entry[0]] = entry[1];
//             }
//         });
//         return r;
//     }, {} as Record<string, unknown>) as Record<string, unknown>;
//     if (found) {
//         return SomeOption(ret);
//     } else {
//         return NoneOption;
//     }
// }
