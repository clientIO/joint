import { createRequire } from 'node:module';
// eslint-disable-next-line unicorn/import-style
import { join } from 'node:path';

/**
 * Resolves a synchronous `require` for loading optional Node-only peers
 * (`jsdom`, `@napi-rs/canvas`) and package assets (the theme stylesheet).
 *
 * Anchored at the working directory (not this module): optional peers and the
 * consumer's assets live in the CONSUMING project's `node_modules`, which a
 * module-anchored `require` may miss in a monorepo / symlinked checkout (where
 * this package resolves to a different `node_modules` subtree than the app's).
 * Works in both CommonJS (Jest) and native ESM (e.g. Bun). `import.meta` is
 * avoided because it cannot appear in a file also transpiled to CommonJS.
 * @returns a `require` able to resolve installed packages and assets.
 */
export function getNodeRequire(): ReturnType<typeof createRequire> {
  return createRequire(join(process.cwd(), 'noop.js'));
}
