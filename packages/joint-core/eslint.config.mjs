import { jsConfig, tsConfig, testingConfig } from '@joint/eslint-config';
import { defineConfig } from 'eslint/config';

export default defineConfig([
    ...jsConfig,
    ...tsConfig,
    ...testingConfig,
    {
        // Disable some rules
        files: ['**/*.d.ts'],
        rules: {
            '@typescript-eslint/no-explicit-any': ['off'],
        },
    },
    // add globals for all files
    {
        // test global in test files and test folders and demo files
        files: ['**/test/**', '**/demo/**'],
        languageOptions: {
            globals: {
                joint: 'readonly',
                V: 'readonly',
                g: 'readonly',
                $: 'readonly',
                _: 'readonly',
                QUnit: 'readonly',
                sinon: 'readonly',
                blanket: 'readonly',
                simulate: 'readonly',
                fixtures: 'readonly',
                graphlib: 'readonly',
                should: 'readonly',
                Vue: 'readonly',
            },
        },
    },
    {
        // Demo files - allow console.logs
        files: ['**/demo/**'],
        languageOptions: {
            globals: {
                d3:'readonly',
                rough:'readonly',
                paper:'readonly',
            },
        },
        rules: {
            '@typescript-eslint/no-namespace':'off',
            '@typescript-eslint/no-explicit-any':'off',
            'no-unused-vars':'off',
            'no-var': 'off',
            'no-redeclare':'off',
            'no-console': 'off',
            'import/no-unresolved':'off'
        },
    },
]);
