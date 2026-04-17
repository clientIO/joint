import { defineConfig } from 'vite';
import { analyzer } from 'vite-bundle-analyzer';

const entry = process.env.ENTRY || 'S';

export default defineConfig({
    root: '.',
    build: {
        outDir: `dist/${entry}`,
        minify: true,
        rollupOptions: {
            input: `index-${entry}.html`,
        }
    },
    plugins: [
        analyzer({ analyzerMode: 'static', openAnalyzer: false })
    ],
});
