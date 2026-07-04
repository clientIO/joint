import { createRollupConfig } from './scripts/create-rollup-config';

export default createRollupConfig({
  entries: ['src/index.ts', 'src/internal.ts'],
  cssEntries: ['src/css/styles.css'],
  external: [
    'react',
    'react-dom',
    'use-sync-external-store',
    '@joint/core',
    '@joint/layout-directed-graph',
  ],
});
