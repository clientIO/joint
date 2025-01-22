import { resolve } from 'path'
import { defineConfig, type ViteUserConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import mockSVG from '@joint/vite-plugin-mock-svg';

export default defineConfig({
  plugins: [react(), mockSVG()] as ViteUserConfig["plugins"],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'public/index.html'),
      },
    },
  },
  test: {
    environment: 'jsdom',
    //globals: true,
    //setupFiles: './src/setupTests.ts',
  },
});
