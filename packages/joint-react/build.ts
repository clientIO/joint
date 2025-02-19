/* eslint-disable no-console */
/* eslint-disable sonarjs/no-nested-conditional */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import esbuild from 'esbuild'
import path from 'node:path'
import fs from 'node:fs/promises'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import packageJson from './package.json' assert { type: 'json' }

/**
 * Recursively get all .ts files in a directory.
 * @param dir - The directory to search.
 * @returns An array of file paths.
 */
// eslint-disable-next-line unicorn/prevent-abbreviations
async function getAllFiles(dir: string): Promise<string[]> {
  // eslint-disable-next-line unicorn/prevent-abbreviations
  const dirParents = await fs.readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    dirParents.map((dirent) => {
      const response = path.resolve(dir, dirent.name)
      if (dirent.isDirectory()) {
        return getAllFiles(response)
      }
      // Skip files that include ".test." in their name
      if (response.includes('.test.')) {
        return []
      }
      return response.endsWith('.ts') || response.endsWith('.tsx') ? [response] : []
    })
  )
  return files.flat()
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
await fs.cp(entryDir, path.join(outDir, 'src'), { recursive: true })

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
  'bunx tsc --project tsconfig.types.json --module ESNext --outDir dist/types --emitDeclarationOnly true'
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
