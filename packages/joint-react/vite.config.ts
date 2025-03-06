import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mdPlugin from 'vite-plugin-md';
import path from 'node:path';
import tsconfigPaths from 'vite-tsconfig-paths';
export default defineConfig({
  plugins: [react(), mdPlugin(), tsconfigPaths()],
  assetsInclude: ['**/*.md'],
  build: {
    lib: {
      entry: path.resolve(import.meta.dirname, 'src/index.ts'),
      name: 'JointReact',
      fileName: (format) => `joint-react.${format}.js`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
});
