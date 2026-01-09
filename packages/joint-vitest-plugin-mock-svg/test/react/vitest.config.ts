import { defineConfig, type ViteUserConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import mockSVG from '@joint/vitest-plugin-mock-svg';

export default defineConfig({
    plugins: [
        react(),
        mockSVG(),
    ] as ViteUserConfig['plugins'],
    test: {
        environment: 'jsdom',
    },
});
