import * as ts from 'typescript';

export namespace Generator {
  export class Generated {
    public readonly js: ts.TranspileOutput;

    public constructor(private readonly inTs: string) {
      this.js = ts.transpileModule(inTs, {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
        },
      });
    }
  }

  export function fromString(str: string): Generated {
    return new Generated(str);
  }
}
