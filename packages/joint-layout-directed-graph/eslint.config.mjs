import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';

export default defineConfig([
    {
        // globally ignored folders
        ignores: ['coverage/', 'dist/']
    },
    {
        // common rules for all files
        extends: [js.configs.recommended],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.node
            }
        },
        rules: {
            'indent': ['error', 4, { 'SwitchCase': 1 }],
            'space-before-function-paren': ['error', 'never'],
            'no-console': ['error', { 'allow': ['warn'] }],
            'object-curly-spacing': ['error', 'always', { 'objectsInObjects': false }],
            'no-constant-condition': ['off'],
            'no-undef': ['error'],
            'no-unused-vars': ['error', { 'vars': 'local', 'args': 'none' }],
            'quotes': ['error', 'single'],
            'semi': ['error', 'always'],
            'no-prototype-builtins': ['off']
        }
    },
    {
        // support `import _ with { type: 'json' }` syntax
        files: ['rollup.config.mjs'],
        languageOptions: {
            ecmaVersion: 2025
        }
    },
    {
        // extra globals
        files: ['test/index.js'],
        languageOptions: {
            globals: {
                joint: 'readonly',
                graphlib: 'readonly',
                QUnit: 'readonly'
            }
        }
    },
    {
        // extra globals
        files: ['test/nodejs/nodejs.js'],
        languageOptions: {
            globals: {
                describe: 'readonly',
                it: 'readonly',
                should: 'readonly'
            }
        }
    }
]);
