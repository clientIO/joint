/* eslint-disable unicorn/prefer-module */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mdPlugin from 'vite-plugin-md';
import path from 'node:path';
import tsconfigPaths from 'vite-tsconfig-paths';
export default defineConfig({
  // @ts-expect-error - vite defaults
  plugins: [react(), mdPlugin(), tsconfigPaths()],
  assetsInclude: ['**/*.md'],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'JointReact',
      fileName: (format) => `joint-react.${format}.js`,
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'use-sync-external-store',
        '@joint/core',
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
});
