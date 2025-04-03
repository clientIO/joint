import { defineConfig } from 'eslint/config';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import js from '@eslint/js';

export default defineConfig([
    {
        ignores: ['**/node_modules', 'scripts', 'dist', 'build'],
        files: ['**/*.ts', '**/*.tsx'],
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
            }
        },
        rules: {
            'comma-spacing': 'off',
            '@typescript-eslint/comma-spacing': ['error'],
            'space-before-function-paren': 'off',
            '@typescript-eslint/space-before-function-paren': ['error', 'never'],
            'semi': 'off',
            '@typescript-eslint/semi': ['error', 'always'],
            'object-curly-spacing': 'off',
            '@typescript-eslint/object-curly-spacing': ['error', 'always', {
                'objectsInObjects': false
            }],
            'semi-spacing': ['error', {
                'before': false,
                'after': true
            }],
            'space-in-parens': ['error', 'never'],
            '@typescript-eslint/type-annotation-spacing': ['error', {
                'after': true,
                'before': false
            }],
            'quotes': 'off',
            '@typescript-eslint/quotes': ['error', 'single'],
            'indent': 'off',
            '@typescript-eslint/indent': ['error', 4, {
                'SwitchCase': 1
            }]
        }
    }
]);
