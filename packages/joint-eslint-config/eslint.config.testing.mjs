import { defineConfig } from 'eslint/config';
import globals from 'globals';

/**
 * Testing config to add globals for test files (mocha and jest)
 */
export const testingConfig = defineConfig([
    {
        // add globals for tests
        files: ['**/test/**', '**/__tests__/**', '**/demo/**', '**/*.test.(js|jsx|ts|tsx)'],
        languageOptions: {
            globals: {
                ...globals.mocha,
                ...globals.jest,
            },
        },
    },
]);