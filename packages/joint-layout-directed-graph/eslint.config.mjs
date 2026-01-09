import { tsConfig, jsConfig, rollupConfig, testingConfig } from '@joint/eslint-config';
import { defineConfig } from 'eslint/config';

export default defineConfig([
    ...jsConfig,
    ...tsConfig,
    ...rollupConfig,
    ...testingConfig,
    // define globals
    {
        languageOptions: {
            globals: {
                QUnit: 'readonly',
                joint: 'readonly',
                graphlib: 'readonly',
                should: 'readonly',
            },
        }
    },
]);
