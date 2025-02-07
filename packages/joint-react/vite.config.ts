/* eslint-disable unicorn/prefer-node-protocol */
/**
 * Custom vite config used by Storybook.
 */
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'), // Main entry point for the library
      name: 'JointReact', // Global variable name for UMD builds
      fileName: (format) => `joint-react.${format}.js`, // Output file format
    },
    rollupOptions: {
      // Externalize peer dependencies to prevent bundling them
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
})
