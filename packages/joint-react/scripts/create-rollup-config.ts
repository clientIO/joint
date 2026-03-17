import { defineConfig, type RollupOptions } from 'rollup';
import esbuild from 'rollup-plugin-esbuild';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

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
    nodeResolve({
      extensions: ['.js', '.ts', '.tsx'],
      preferBuiltins: false,
      browser: true,
      mainFields: ['module', 'main'],
    }),
    commonjs(),
  ];
}

export function createRollupConfig(options: CreateRollupConfigOptions): RollupOptions[] {
  const { entries, external } = options;
  const plugins = createPlugins();

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
