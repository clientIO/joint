import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default defineConfig([
    {
        // globally ignored folders
        ignores: ['build/', 'dist/', 'demo/', 'node_modules/']
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
            'no-console': ['error', { 'allow': ['warn'] }],
            'no-constant-condition': ['off'],
            'no-prototype-builtins': ['off'],
            'no-undef': ['error'],
            'no-unused-vars': ['error', { 'vars': 'local', 'args': 'none' }],
            'object-curly-spacing': ['error', 'always', { 'objectsInObjects': false }],
            'prefer-const': ['off'], // TODO: TRY TO REMOVE (WAS ONLY FOR TESTS)
            'quotes': ['error', 'single'],
            'semi': ['error', 'always'],
            'space-before-function-paren': ['error', 'never'],
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
    {
        // rules for TS files
        files: ['**/*.ts', '**/*.mts'],
        plugins: {
            '@typescript-eslint': tsPlugin,
        },
        extends: [
            js.configs.recommended,
            '@typescript-eslint/recommended',
        ],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'module',
            },
        },
        rules: {
            'indent': ['error', 4, { 'SwitchCase': 1 }],
            'no-console': ['error', { 'allow': ['warn'] }],
            'no-constant-condition': ['off'],
            'no-prototype-builtins': ['off'],
            'no-undef': ['off'],
            'no-unused-vars': ['off'], // TODO: TRY TO REMOVE (SET BY TYPESCRIPT-ESLINT?)
            '@typescript-eslint/no-unused-vars': ['off'],
            'object-curly-spacing': ['error', 'always', { 'objectsInObjects': false }],
            'prefer-const': ['off'], // TODO: TRY TO REMOVE (WAS ONLY FOR TESTS)
            'quotes': ['error', 'single'],
            'semi': ['error', 'always'],
            'space-before-function-paren': ['error', 'never'],
        },
    },
    {
        // rules for tests
        files: ['**/test/**'],
        languageOptions: {
            globals: {
                ...globals.mocha,
                'joint': 'readonly',
                'V': 'readonly',
                'g': 'readonly',
                '$': 'readonly',
                '_': 'readonly',
                'QUnit': 'readonly',
                'sinon': 'readonly',
                'blanket': 'readonly',
                'simulate': 'readonly',
                'fixtures': 'readonly',
            },
        },
    },
    {
        // rules for types
        files: ['**/types/*.d.ts'],
        plugins: {
            '@typescript-eslint': tsPlugin,
        },
        extends: [
            js.configs.recommended,
            '@typescript-eslint/recommended',
        ],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'module',
            },
        },
        rules: {
            'comma-spacing': ['error'], // TODO: TRY TO REMOVE
            'indent': ['error', 4, { 'SwitchCase': 1 }],
            '@typescript-eslint/no-empty-object-type': ['off'],
            '@typescript-eslint/no-explicit-any': ['off'], // TODO: SWITCH TO 'warn'
            '@typescript-eslint/no-unsafe-function-type': ['off'], // TODO: SWITCH TO 'warn'
            '@typescript-eslint/no-unused-vars': ['off'], // TODO: SWITCH TO 'warn'
            'no-var': ['off'], // TODO: SWITCH TO 'warn'
            'object-curly-spacing': ['error', 'always', { 'objectsInObjects': false }],
            'quotes': ['error', 'single'],
            'semi': ['error', 'always'],
            'semi-spacing': ['error', { 'before': false, 'after': true }],
            'space-before-function-paren': ['error', 'never'],
            'space-in-parens': ['error', 'never'],
            // '@stylistic/type-annotation-spacing': ['error', { 'after': true, 'before': false }], // TODO: ADD @stylistic/eslint-plugin
        }
    },
]);
