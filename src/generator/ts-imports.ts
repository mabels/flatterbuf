import { TSWriter, TSRefWriter, TSWriterArgs, TSWriteLine } from './ts';
import { Definition } from '../definition';

export interface TSImportArgs {
  readonly external?: {
    readonly fname: string;
    readonly def: string;
    readonly as?: string;
  };
  readonly sWriter?: TSRefWriter;
}

export class TSImport<T> {
  constructor(public readonly imp: TSImportArgs) {}

  public get name() {
    if (this.imp.external) {
      return this.imp.external.def;
    } else {
      return this.imp.sWriter!.def.name;
    }
  }

  public toString(wr: TSWriter) {
    if (this.imp.external) {
      return `import { ${this.imp.external.def} ${this.imp.external.as ? `as ${this.imp.external.as} ` : ''}} from ${wr.quote(this.imp.external.fname)};`;
    } else {
      return `import { ${this.imp.sWriter!.def.name} } from ${wr.quote(this.imp.sWriter!.fname)};`;
    }
  }
}

export class TSImports<T> {
  private readonly imports: Map<string, TSImport<T>> = new Map();

  constructor(public readonly args: TSWriterArgs) {
    this.add(new TSImport({
      external: {
        def: 'Definition',
        as: '__Definition',
        fname: args.definitionPath || 'flatterbuf/definition',
      },
    }));
    this.add(new TSImport({
      external: {
        def: 'Runtime',
        as: '__Runtime',
        fname: args.runtimePath || 'flatterbuf/runtime',
      },
    }));
  }

  public add(ts: TSImport<T>): TSImport<T> {
    this.imports.set(ts.name, ts);
    return ts;
  }

  public values(): TSImport<T>[] {
    return Array.from(this.imports.values());
  }
  public prepend<T>(wl: TSWriteLine, def: Definition.Types.NamedType<T>) {
    wl.prependLine(0, ``);
    this.values()
      .filter(i => !(i.imp.sWriter && i.imp.sWriter.def == def))
      .reverse()
      .forEach(i => wl.prependLine(0, i.toString(wl.wr)));
    wl.prependLine(0, `// generated ${def.name}`)
  }
}
