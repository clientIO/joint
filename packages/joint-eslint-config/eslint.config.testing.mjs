import { defineConfig } from 'eslint/config';
import globals from 'globals';

/**
 * ESLint config to add globals for test files
 */
export const testingConfig = defineConfig([
    {
        // Add globals for mocha and jest
        files: ['**/test/**', '**/__tests__/**', '**/*.test.(js|jsx|ts|tsx)'],
        languageOptions: {
            globals: {
                ...globals.mocha,
                ...globals.jest,
            },
        },
    },
]);
