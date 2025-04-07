import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
    build: {
        lib: {
            entry: {
                index: './index.ts',
            },
        },
        minify: false,
        rollupOptions: {
            external: ['vitest'],
            output: [
                {
                    esModule: true,
                    exports: 'named',
                    format: 'es',
                },
                {
                    exports: 'named',
                    format: 'cjs',
                    interop: 'auto',
                },
            ],
        },
        sourcemap: true,
        target: 'esnext',
    },
});
