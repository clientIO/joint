import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import stylisticPlugin from '@stylistic/eslint-plugin';

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
    },
    {
        // rules for JS files
        files: ['**/*.js', '**/*.mjs'],
        ignores: ['**/test/ts/*.js'],
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
    {
        // extra globals
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
        // different rules for types
        files: ['**/types/*.d.ts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'module',
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
            '@stylistic': stylisticPlugin,
        },
        extends: [
            js.configs.recommended,
            '@typescript-eslint/recommended',
        ],
        rules: {
            'comma-spacing': ['error'],
            'indent': ['error', 4, { 'SwitchCase': 1 }],
            '@typescript-eslint/no-empty-object-type': ['off'],
            '@typescript-eslint/no-explicit-any': ['off'],
            '@typescript-eslint/no-unsafe-function-type': ['off'],
            '@typescript-eslint/no-unused-vars': ['off'],
            'no-var': ['off'],
            'object-curly-spacing': ['error', 'always', { 'objectsInObjects': false }],
            'quotes': ['error', 'single'],
            'semi': ['error', 'always'],
            'semi-spacing': ['error', { 'before': false, 'after': true }],
            'space-before-function-paren': ['error', 'never'],
            'space-in-parens': ['error', 'never'],
            '@stylistic/type-annotation-spacing': ['error', { 'after': true, 'before': false, 'overrides': { 'arrow': { 'before': true, 'after': true }}}],
        }
    },
]);
