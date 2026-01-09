import { tsConfig, jsConfig, rollupConfig } from '@joint/eslint-config';
import { defineConfig } from 'eslint/config';

export default defineConfig([
    ...jsConfig,
    ...tsConfig,
    ...rollupConfig,
    // define globals
    {
        languageOptions: {
            globals: {
                QUnit: 'readonly',
                joint: 'readonly',
                graphlib: 'readonly',
                should: 'readonly',
            },
        },
    },
]);