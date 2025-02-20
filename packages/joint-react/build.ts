 
 
/* eslint-disable @typescript-eslint/ban-ts-comment */
import esbuild from 'esbuild'
import path from 'node:path'
import fs from 'node:fs/promises'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import packageJson from './package.json' assert { type: 'json' }
// eslint-disable-next-line depend/ban-dependencies
import { glob } from 'glob'

/**
 * Recursively get all .ts and .tsx files in a directory, excluding test and story files.
 * @param directory - The directory to search.
 * @returns An array of file paths.
 */
async function getAllFiles(directory: string): Promise<string[]> {
  return glob(`${directory}/**/*.{ts,tsx}`, {
    ignore: [
      '**/__tests__/**', // Ignore test directories
      '**/*.test.ts', // Ignore test files
      '**/*.test.tsx',
      '**/*.spec.ts', // Ignore spec files
      '**/*.spec.tsx',
      '**/stories/**', // Ignore stories directories
      '**/*.stories.ts', // Ignore story files
      '**/*.stories.tsx',
    ],
  })
}
const execAsync = promisify(exec)
// eslint-disable-next-line unicorn/prevent-abbreviations
const entryDir = 'src'
const entry = path.join(entryDir, 'index.ts')
// eslint-disable-next-line unicorn/prevent-abbreviations
const outDir = 'dist'
const external = ['react', 'use-sync-external-store', '@joint/core']
// Ensure output directories
await fs.mkdir(path.join(outDir, 'cjs'), { recursive: true })
await fs.mkdir(path.join(outDir, 'esm'), { recursive: true })
await fs.mkdir(path.join(outDir, entryDir), { recursive: true })

// Copy source files for react-native compatibility
// await fs.cp(entryDir, path.join(outDir, 'src'), { recursive: true })

async function copySourceFiles() {
  const files = await getAllFiles(entryDir)
  for (const file of files) {
    await fs.cp(file, path.join(outDir, file))
  }
}

await copySourceFiles()
// CommonJS build (single file)
await esbuild.build({
  entryPoints: [entry],
  bundle: true,
  format: 'cjs',
  outfile: path.join(outDir, 'cjs/index.js'),
  minify: true,
  preserveSymlinks: true,
  external,
})

// ESM build (files as they are)
await esbuild.build({
  entryPoints: await getAllFiles(entryDir),
  bundle: false,
  format: 'esm',
  outdir: path.join(outDir, 'esm'),
  minify: true,
  preserveSymlinks: true,
  // external,
})

// TypeScript types generation using tsconfig.types.json
await execAsync(
  'npx tsc --project tsconfig.types.json --module ESNext --outDir dist/types --emitDeclarationOnly true'
)

// @ts-expect-error
delete packageJson.scripts
// @ts-ignore
delete packageJson.devDependencies
// @ts-ignore
delete packageJson.private
// @ts-ignore
delete packageJson.workspaces

// remove dist name from package json

// "main": "dist/cjs/index.js",
// "module": "dist/esm/index.js",
// "types": "dist/types/index.d.ts",
// "typescript": "dist/src/index.ts",

packageJson.main = 'cjs/index.js'
packageJson.module = 'esm/index.js'
packageJson.types = 'types/index.d.ts'
packageJson.typescript = 'src/index.ts'

// Copy package.json and README.md
await fs.writeFile(path.join(outDir, 'package.json'), JSON.stringify(packageJson, null, 2))

// Copy README.md
await fs.copyFile('README.md', path.join(outDir, 'README.md'))

// Copy LICENSE
await fs.copyFile('LICENSE', path.join(outDir, 'LICENSE'))
