import { defineConfig } from 'eslint/config';

/**
 * ESLint config to support `with` keyword in Rollup configs (ES2025 feature)
 */
export const rollupConfig = defineConfig([
    {
        // Add support for `import _ with { type: 'json' }` syntax
        files: ['rollup.config.mjs'],
        languageOptions: {
            ecmaVersion: 2025,
        },
    },
]);
