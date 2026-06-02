import { createRollupConfig } from './scripts/create-rollup-config';

export default createRollupConfig({
  // `dom-shim-flag` is a standalone entry (a single string constant, zero Node
  // imports) so client code can read the server-detection flag via the
  // `@joint/svg-shim/flag` subpath without pulling the Node-only shim barrel.
  entries: ['src/index.ts', 'src/install.ts', 'src/dom-shim-flag.ts'],
  external: ['jsdom', 'happy-dom', '@napi-rs/canvas', 'node:module', 'node:path'],
});
