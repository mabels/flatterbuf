import {Types} from '..';

export interface TypeTester {
    Builder(name: string): Types.Struct.Definition;
    Default: Record<string, unknown>;
    Init: Record<string, unknown>;
    Type: Types.Struct.Definition;
  }
