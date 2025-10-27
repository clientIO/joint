import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';

export default defineConfig([
    {
        // globally ignored folders
        ignores: ['coverage/', 'dist/', 'node_modules/']
    },
    {
        // common rules for all checked files
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                Uint8Array: 'readonly',
                CDATASection: 'readonly',
            },
        },
        extends: [
            js.configs.recommended,
        ],
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
            'no-prototype-builtins': ['off'],
        }
    },
    {
        // rules for JS files
        files: ['**/*.js', '**/*.mjs'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
        },
    },
    {
        // extra support for `import _ with { type: 'json' }` syntax
        files: ['rollup.config.mjs'],
        languageOptions: {
            ecmaVersion: 2025,
        },
    },
    {
        // extra globals
        files: ['test/index.js'],
        languageOptions: {
            globals: {
                joint: 'readonly',
                graphlib: 'readonly',
                QUnit: 'readonly',
            },
        },
    },
    {
        // extra globals
        files: ['test/nodejs/nodejs.js'],
        languageOptions: {
            globals: {
                describe: 'readonly',
                it: 'readonly',
                should: 'readonly',
            },
        },
    },
]);
