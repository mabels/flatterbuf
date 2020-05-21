import { TSWriteLine, TSWriter } from '../src/generator/ts';

test('write \\n\\n\\n', () => {
    const tsw = new TSWriteLine(new TSWriter());
    tsw.write(1, '\n\n\n');
    expect(tsw.toString()).toBe('\n\n\n');
});

test('writeline \\n\\n\\n', () => {
    const tsw = new TSWriteLine(new TSWriter());
    tsw.writeLine(1, '\n\n\n');
    expect(tsw.toString()).toBe('\n\n\n\n');
});

test('write \\n];', () => {
    const tsw = new TSWriteLine(new TSWriter());
    tsw.write(1, '\n];');
    expect(tsw.toString()).toBe('\n  ];');
});

test('writeline \\n];', () => {
    const tsw = new TSWriteLine(new TSWriter());
    tsw.writeLine(1, '\n];');
    expect(tsw.toString()).toBe('\n  ];\n');
});

test('writeline \\ndoof\\n\\n', () => {
    const tsw = new TSWriteLine(new TSWriter());
    tsw.writeLine(1, '\ndoof\n\n');
    expect(tsw.toString()).toBe('\n  doof\n\n\n');
});

test('writeline doof', () => {
    const tsw = new TSWriteLine(new TSWriter());
    tsw.writeLine(1, 'doof');
    expect(tsw.toString()).toBe('  doof\n');
})