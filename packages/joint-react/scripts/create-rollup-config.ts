import path from 'node:path';
import { defineConfig, type Plugin, type RollupOptions } from 'rollup';
import esbuild from 'rollup-plugin-esbuild';
import { build as runEsbuild } from 'esbuild';
import dts from 'rollup-plugin-dts';

interface CreateRollupConfigOptions {
  /** Entry points to build (e.g. ['src/index.ts', 'src/internal.ts']) */
  readonly entries: string[];
  /** CSS entry points to bundle (with `@import` statements inline) into `dist`  */
  readonly cssEntries: string[];
  /** External dependencies to exclude from the bundle */
  readonly external: string[];
}

/**
 * Builds a standalone Rollup config whose sole job is to bundle CSS entry points
 * (resolving and inlining their `@import`s via esbuild) into self-contained files
 * at the root of `dist`, so the package can ship CSS from `dist` without publishing
 * the `src` tree.
 *
 * CSS bundling is a side-effect rather than a Rollup graph output, so this config
 * uses a virtual JS entry and discards the resulting empty chunk.
 * @param cssEntries - CSS source files to bundle (e.g. ['src/css/styles.css']).
 * @returns A Rollup configuration that emits one bundled `.css` file per entry.
 */
function createCssConfig(cssEntries: string[]): RollupOptions {
  const virtualEntry = '\0bundle-css';
  const cssPlugin: Plugin = {
    name: 'bundle-css',
    resolveId: (id) => (id === virtualEntry ? virtualEntry : undefined),
    load: (id) => (id === virtualEntry ? '' : undefined),
    async buildStart() {
      await Promise.all(
        cssEntries.map((entry) =>
          runEsbuild({
            entryPoints: [entry],
            bundle: true,
            outfile: path.join('dist', path.basename(entry)),
            loader: { '.css': 'css' },
          })
        )
      );
    },
    generateBundle(_options, bundle) {
      // esbuild already wrote the CSS to disk; drop the empty placeholder JS chunk.
      for (const fileName of Object.keys(bundle)) {
        Reflect.deleteProperty(bundle, fileName);
      }
    },
  };

  return {
    input: virtualEntry,
    output: { dir: 'dist' },
    plugins: [cssPlugin],
  };
}

/**
 * Creates the default set of Rollup plugins for building the package.
 * @returns Array of Rollup plugins configured with esbuild for TypeScript/JSX transpilation.
 */
function createPlugins() {
  return [
    esbuild({
      include: /\.[jt]sx?$/,
      target: 'es2020',
      jsx: 'automatic',
    }),
  ];
}

/**
 * Creates ESM and CJS Rollup configurations with preserved module structure.
 * @param options - Build configuration including entry points and external dependencies.
 * @returns Array of Rollup configurations for ESM and CJS output formats.
 */
export function createRollupConfig(options: CreateRollupConfigOptions): RollupOptions[] {
  const { entries, external: externalList, cssEntries } = options;
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

    // Declaration build (bundled .d.ts per entry)
    {
      // Named inputs so chunks emit as dist/types/<name>.d.ts (not dist/types/src/<name>.d.ts)
      input: Object.fromEntries(
        entries.map((entry) => [
          entry.replace(/^src\//, '').replace(/\.tsx?$/, ''),
          entry,
        ])
      ),
      output: {
        dir: 'dist/types',
        format: 'esm',
      },
      external,
      plugins: [dts()],
    },

    // CSS build (bundles standalone stylesheets into dist)
    createCssConfig(cssEntries),
  ]);
}
