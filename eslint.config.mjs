import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';

export default defineConfig([
    {
        // globally ignored folders
        ignores: ['**/build/', '**/dist/', '**/node_modules/']
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
        },
    },
    {
        // rules for JS files
        files: ['**/*.js', '**/*.mjs'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
        },
    },
]);
