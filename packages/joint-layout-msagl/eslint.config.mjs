import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

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
    },
    {
        // rules for JS files
        files: ['**/*.js', '**/*.mjs'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
        },
        extends: [
            js.configs.recommended,
        ],
        rules: {
            'indent': ['error', 4, { 'SwitchCase': 1 }],
            'no-console': ['error', { 'allow': ['warn'] }],
            'no-constant-condition': ['off'],
            'no-prototype-builtins': ['off'],
            'no-undef': ['error'],
            'no-unused-vars': ['error', { 'vars': 'local', 'args': 'none' }],
            'object-curly-spacing': ['error', 'always', { 'objectsInObjects': false }],
            'quotes': ['error', 'single'],
            'semi': ['error', 'always'],
            'space-before-function-paren': ['error', 'never'],
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
                QUnit: 'readonly',
            },
        },
    },
    {
        // rules for TS files
        files: ['**/*.ts', '**/*.mts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'module',
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
        },
        extends: [
            js.configs.recommended,
            '@typescript-eslint/recommended',
        ],
        rules: {
            'indent': ['error', 4, { 'SwitchCase': 1 }],
            'no-console': ['error', { 'allow': ['warn'] }],
            'no-constant-condition': ['off'],
            'no-prototype-builtins': ['off'],
            'no-undef': ['off'],
            '@typescript-eslint/no-unused-vars': ['off'],
            'object-curly-spacing': ['error', 'always', { 'objectsInObjects': false }],
            'quotes': ['error', 'single'],
            'semi': ['error', 'always'],
            'space-before-function-paren': ['error', 'never'],
        },
    },
]);
