import { createRolldownConfig } from './scripts/create-rolldown-config';

export default createRolldownConfig({
  entries: ['src/index.ts', 'src/internal.ts'],
  external: [
    'react',
    'react-dom',
    'use-sync-external-store',
    '@joint/core',
    '@joint/layout-directed-graph',
  ],
});
