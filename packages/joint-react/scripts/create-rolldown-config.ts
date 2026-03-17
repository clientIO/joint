import { defineConfig, type RolldownOptions } from 'rolldown';

interface CreateRolldownConfigOptions {
  /** Entry points to build (e.g. ['src/index.ts', 'src/internal.ts']) */
  readonly entries: string[];
  /** External dependencies to exclude from the bundle */
  readonly external: string[];
}

export function createRolldownConfig(options: CreateRolldownConfigOptions): RolldownOptions[] {
  const { entries, external } = options;

  return defineConfig([
    // ESM build (preserve modules)
    {
      input: entries,
      output: {
        dir: 'dist/esm',
        format: 'esm',
        sourcemap: true,
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
      external,
    },

    // CJS build (preserve modules)
    {
      input: entries,
      output: {
        dir: 'dist/cjs',
        format: 'cjs',
        sourcemap: true,
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
      external,
    },
  ]);
}
