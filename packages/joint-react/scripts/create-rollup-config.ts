import { defineConfig, type RollupOptions } from 'rollup';
import esbuild from 'rollup-plugin-esbuild';

interface CreateRollupConfigOptions {
  /** Entry points to build (e.g. ['src/index.ts', 'src/internal.ts']) */
  readonly entries: string[];
  /** External dependencies to exclude from the bundle */
  readonly external: string[];
}

function createPlugins() {
  return [
    esbuild({
      include: /\.[jt]sx?$/,
      target: 'es2020',
      jsx: 'automatic',
    }),
  ];
}

export function createRollupConfig(options: CreateRollupConfigOptions): RollupOptions[] {
  const { entries, external: externalList } = options;
  const plugins = createPlugins();

  const external = (id: string) =>
    externalList.some((dep) => id === dep || id.startsWith(`${dep}/`));

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
      context: 'globalThis',
      external,
      plugins,
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
      context: 'globalThis',
      external,
      plugins,
    },
  ]);
}
