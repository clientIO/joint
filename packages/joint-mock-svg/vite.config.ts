import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
    build: {
        lib: {
            entry: {
                index: './src/index.ts',
            },
        },
        // Kept readable: this is a short module that people read when a mock
        // does not behave the way their test needs.
        minify: false,
        rollupOptions: {
            // Nothing to externalize - the whole point of this package is that
            // it depends on no test runner.
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
