import { Types } from 'flatterbuf';

import { TSWriter, TSRefWriter, TSWriterArgs, TSWriteLine } from './ts';

export interface Import {
  readonly name: string;
  readonly as?: string;
}
export interface TSImportArgs {
  readonly external?: {
    readonly fname: string;
    readonly defs: Import[];
  };
  readonly sWriter?: TSRefWriter;
}

export class TSImport {
  constructor(public readonly imp: TSImportArgs) {}

  public get key() {
    if (this.imp.external) {
      return this.imp.external.fname;
    } else {
      return this.imp.sWriter!.fname;
    }
  }

  public toString(wr: TSWriter) {
    if (this.imp.external) {
      const imports = this.imp.external.defs
        .sort((a, b) => {
          if (a.name < b.name) {
            return 1;
          } else if (a.name > b.name) {
            return -1;
          }
          return 0;
        })
        .map((def) => `${def.name}${def.as ? ` as ${def.as}` : ''}`)
        .join(', ');
      return `import { ${imports} } from ${wr.quote(this.imp.external.fname)};`;
    } else {
      return `import { ${this.imp.sWriter!.def.name} } from ${wr.quote(this.imp.sWriter!.fname)};`;
    }
  }
}

export class TSImports {
  private readonly imports: Map<string, TSImport> = new Map();

  constructor(public readonly args: TSWriterArgs) {
    this.add(
      new TSImport({
        external: {
          defs: [
            {
              name: 'Types',
            },
            {
              name: 'Align',
            },
            {
              name: 'Optional',
            },
            {
              name: 'Utils',
            },
            {
              name: 'ChunkBuffer',
            },
            {
              name: 'StreamBuffer',
            },
            // {
            //   name: 'NestedReadonly',
            // },
            // {
            //   name: 'NestedPartial',
            // },
          ],
          fname: args.definitionPath || 'flatterbuf/definition',
        },
      }),
    );
  }

  public add(ts: TSImport): TSImport {
    const f = this.imports.get(ts.key);
    if (!f) {
      this.imports.set(ts.key, ts);
    } else if (ts.imp.external) {
      throw Error(`TSImport double:${ts.key}`);
    }
    return ts;
  }

  public values(): TSImport[] {
    return Array.from(this.imports.values());
  }
  public prepend<T>(wl: TSWriteLine, def: Types.Base.NamedType<T>) {
    wl.prependLine(0, ``);
    this.values()
      .filter((i) => !(i.imp.sWriter && i.imp.sWriter.def == def))
      .reverse()
      .forEach((i) => wl.prependLine(0, i.toString(wl.wr)));
    wl.prependLine(0, `// generated ${def.name}`);
  }
}
