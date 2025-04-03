import { defineConfig } from 'eslint/config';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import js from '@eslint/js';
import globals from 'globals';

export default defineConfig([
    {
        ignores: ['**/node_modules', 'scripts', 'dist', 'build'],
        files: ['**/*.js', '**/*.mjs', '**/*.ts'],
        extends: [
            js.configs.recommended,
            'plugin:@typescript-eslint/recommended'
        ],
        plugins: {
            '@typescript-eslint': typescriptEslint
        },
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'module'
            },
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
                'fixtures': 'readonly'
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
            'no-prototype-builtins': ['off'],
            'prefer-const': ['off'],
            '@typescript-eslint/no-unused-vars': ['off']
        }
    }
]);
