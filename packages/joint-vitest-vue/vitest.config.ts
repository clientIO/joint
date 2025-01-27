import { defineConfig, type ViteUserConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import mockSVG from '@joint/vite-plugin-mock-svg';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    mockSVG(),
  ] as ViteUserConfig["plugins"],
  test: {
    environment: 'jsdom',
  },
});
