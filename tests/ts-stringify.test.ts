import { Types } from '../src/definition';
import { tsStringify, TSWriter } from '../src/generator/ts';

const wr = new TSWriter();

test('bool simple', () => {
  const a = new Types.Boolean.Definition();
  expect(tsStringify(true, a, wr)).toBe('true');
});

test('char simple', () => {
  const a = new Types.Char.Definition({ initial: 'A' });
  expect(tsStringify('B', a, wr)).toBe('66');
});
test('string simple', () => {
  const a = new Types.FixedCString.Definition({ length: 10, initial: 'AMeno' });
  expect(tsStringify('BMeno', a, wr)).toBe('[66, 77, 101, 110, 111]');
});
test('number simple', () => {
  const a = new Types.Uint32.Definition({ initial: 444 });
  expect(tsStringify(56, a, wr)).toBe('56');
});
test('highlow simple', () => {
  const a = new Types.Uint64.Definition({ initial: { high: 44, low: 22 } });
  expect(tsStringify({ low: 44 }, a, wr)).toBe('{ low: 44 }');
});
test('highlow simple', () => {
  const a = new Types.Uint64.Definition({ initial: { high: 44, low: 22 } });
  expect(tsStringify({ high: 44 }, a, wr)).toBe('{ high: 44 }');
});
test('highlow simple', () => {
  const a = new Types.Uint64.Definition({ initial: { high: 44, low: 22 } });

  expect(tsStringify({ high: 44, low: 45 }, a, wr)).toBe('{ low: 45, high: 44 }');
});
test('struct bitsimple', () => {
  const a = new Types.BitStruct.Definition({
    bits: [
      { name: '_1bit', length: 1, initial: true, start: 0 },
      { name: '_2bit', length: 2, initial: 3, start: 3 },
    ],
  });
  expect(
    tsStringify(
      {
        _2bit: 2,
      },
      a,
      wr,
    ),
  ).toBe(`{\n${wr.indent(1)}_2bit: 2,\n}`);
});
test('struct simple', () => {
  const a = new Types.Struct.Definition({
    name: 'Hallo',
    attributes: [
      { name: 'a', type: new Types.Boolean.Definition() },
      { name: 'b', type: new Types.Uint64.Definition() },
      { name: 'c', type: new Types.Int.Definition() },
    ],
  });
  expect(
    tsStringify(
      {
        a: true,
        b: { low: 57 },
      },
      a,
      wr,
    ),
  ).toBe(`{\n${wr.indent(1)}a: true,\n${wr.indent(1)}b: { low: 57 },\n}`);
});
test('array simple', () => {
  const a = new Types.FixedArray.Definition<number>({
    element: new Types.Uint8.Definition(),
    length: 10,
  });
  expect(tsStringify([1, 2], a, wr)).toBe('[1, 2]');
});
test('array struct', () => {
  const a = new Types.FixedArray.Definition<Record<string, any>>({
    element: new Types.Struct.Definition({
      name: 'k',
      attributes: [{ name: 'u', type: new Types.Uint8.Definition() }],
    }),
    length: 10,
  });
  expect(tsStringify([{ u: 4 }, { u: 6 }], a, wr)).toBe(`[{\n${wr.indent(1)}u: 4,\n}, {\n${wr.indent(1)}u: 6,\n}]`);
});

test('struct nested', () => {
  const a = new Types.Struct.Definition({
    name: 'Hallo',
    attributes: [
      { name: 'a', type: new Types.Boolean.Definition() },
      {
        name: 'b',
        type: new Types.Struct.Definition({
          name: 'Jojo',
          attributes: [
            { name: 'c', type: new Types.Uint64.Definition() },
            {
              name: 'd',
              type: new Types.Struct.Definition({
                name: 'Uhu',
                attributes: [{ name: 'e', type: new Types.Int.Definition() }],
              }),
            },
          ],
        }),
      },
    ],
  });
  expect(
    tsStringify(
      {
        a: false,
        b: {
          c: { high: 4 },
          d: {
            e: 4711,
          },
        },
      },
      a,
      wr,
    ),
  ).toBe([
    `{`,
    `${wr.indent(1)}a: false,`,
    `${wr.indent(1)}b: {`,
    `${wr.indent(2)}c: { high: 4 },`,
    `${wr.indent(2)}d: {`,
    `${wr.indent(3)}e: 4711,`,
    `${wr.indent(2)}},`,
    `${wr.indent(1)}},`,
    `}`
  ].join('\n'));
});
