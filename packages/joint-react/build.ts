/* eslint-disable unicorn/prevent-abbreviations */
import esbuild from 'esbuild';
import path from 'node:path';
import fs from 'node:fs/promises';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
// eslint-disable-next-line depend/ban-dependencies
import { glob } from 'glob';

const execAsync = promisify(exec);
const entryDir = 'src';
const entry = path.join(entryDir, 'index.ts');
const outDir = 'dist';
const external = [
  'react',
  'react-dom',
  'use-sync-external-store',
  '@joint/core',
  '@joint/layout-directed-graph',
  '@joint/react-eslint',
];

// eslint-disable-next-line jsdoc/require-jsdoc
async function getAllFiles(directory: string): Promise<string[]> {
  return glob(`${directory}/**/*.{ts,tsx}`, {
    ignore: [
      '**/__tests__/**',
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      '**/stories/**',
      '**/*.stories.ts',
      '**/*.stories.tsx',
    ],
  });
}

/**
 * Clean the dist directory
 */
async function cleanDist() {
  let retries = 3;
  while (retries > 0) {
    try {
      await fs.rm(outDir, { recursive: true, force: true });
      break;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.code === 'ENOTEMPTY' && retries > 1) {
        await new Promise((res) => setTimeout(res, 100));
        retries--;
      } else {
        throw error;
      }
    }
  }
  await fs.mkdir(path.join(outDir, 'cjs'), { recursive: true });
  await fs.mkdir(path.join(outDir, 'esm'), { recursive: true });
  await fs.mkdir(path.join(outDir, 'types'), { recursive: true });
}

/**
 * Build the library
 */
async function build() {
  try {
    await cleanDist();

    // CommonJS build
    await esbuild.build({
      entryPoints: [entry],
      bundle: true,
      format: 'cjs',
      outfile: path.join(outDir, 'cjs/index.js'),
      minify: true,
      treeShaking: true,
      pure: ['console.log'],
      preserveSymlinks: true,
      external,
      sourcemap: true,
      target: ['node14'],
    });

    // ESM build
    await esbuild.build({
      entryPoints: await getAllFiles(entryDir),
      bundle: false,
      format: 'esm',
      outdir: path.join(outDir, 'esm'),
      minify: true,
      treeShaking: true,
      preserveSymlinks: true,
      sourcemap: true,
      target: ['node14'],
    });

    // Generate TypeScript declarations
    await execAsync(
      'npx tsc --project tsconfig.types.json --declaration --emitDeclarationOnly --outDir dist/types'
    );

    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(1);
  }
}

await build();
