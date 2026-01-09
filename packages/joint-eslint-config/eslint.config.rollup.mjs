import { defineConfig } from 'eslint/config';

/**
 * Rollup config to support "with" import keyword - esm 2025 feature
 * and extra support for `import _ with { type: 'json' }` syntax
 */
export const rollupConfig = defineConfig([
    // Rollup config to support "with" import keyword - esm 2025 feature
    {
        // extra support for `import _ with { type: 'json' }` syntax
        files: ['rollup.config.mjs'],
        languageOptions: {
            ecmaVersion: 2025,
        },
    },
]);
