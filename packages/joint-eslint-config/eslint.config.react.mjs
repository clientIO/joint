import { fixupPluginRules } from '@eslint/compat';
import js from '@eslint/js';
import eslintReactPlugin from '@eslint-react/eslint-plugin';
import stylisticPlugin from '@stylistic/eslint-plugin';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import { defineConfig } from 'eslint/config';
import * as dependPlugin from 'eslint-plugin-depend';
import jsdocPlugin from 'eslint-plugin-jsdoc';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactPerfPlugin from 'eslint-plugin-react-perf';
import sonarjsPlugin from 'eslint-plugin-sonarjs';
import unicornPlugin from 'eslint-plugin-unicorn';
import tsEslint from 'typescript-eslint';

import path from 'node:path';

const tsConfigPath = path.resolve('./', 'tsconfig.json');

/**
 * ESLint config to support all React files with .ts, .tsx extensions
 */
export const reactTsConfig = defineConfig([
    // Base recommended configs
    js.configs.recommended,
    jsdocPlugin.configs['flat/recommended-typescript'],
    ...tsEslint.configs.strict,
    dependPlugin.configs['flat/recommended'],
    eslintReactPlugin.configs.recommended,
    unicornPlugin.configs.recommended,
    reactPerfPlugin.configs.flat.recommended,
    sonarjsPlugin.configs.recommended,
    {
        rules: {
            'indent': 'off',
            'object-curly-spacing': 'off',
            'space-before-function-paren': 'off',
        }
    },
    {
        files: [
            '**/*.stories.*',
            '**/*.test.*',
            '**/stories/**/*.{ts,tsx}',
            '.storybook/**/*.{ts,tsx}',
        ],
        plugins: {
            'jsdoc': jsdocPlugin,
        },
        rules: {
            'jsdoc/require-jsdoc': 'off',
            'jsdoc/check-alignment': 'off',
            'jsdoc/check-indentation': 'off',
            'jsdoc/check-param-names': 'off',
            'jsdoc/check-tag-names': 'off',
            'jsdoc/check-types': 'off',
            'jsdoc/implements-on-classes': 'off',
            'jsdoc/match-description': 'off',
            'jsdoc/newline-after-description': 'off',
            'jsdoc/no-types': 'off',
            'jsdoc/require-description': 'off',
            'jsdoc/require-param': 'off',
            'jsdoc/require-returns': 'off',
            'jsdoc/valid-types': 'off',
        },
    },
    // Main rules for project files
    {
        files: ['src/**/*.{ts,tsx}', '.storybook/**/*.{ts,tsx}'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                ecmaFeatures: { jsx: true },
                sourceType: 'module',
                project: tsConfigPath,
            },
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
            '@stylistic': stylisticPlugin,
            'jsdoc': jsdocPlugin,
            'react': reactPlugin,
            'react-hooks': fixupPluginRules(reactHooksPlugin),
        },
        rules: {
            // General JS rules
            'no-console': 'error',
            'no-nested-ternary': 'warn',
            'no-shadow': 'error',
            'no-unused-vars': 'off',
            'prefer-destructuring': 'error',
            'camelcase': 'error',
            'object-shorthand': 'error',
            'no-unneeded-ternary': 'error',

            // TypeScript rules
            '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
            '@typescript-eslint/no-shadow': 'error',
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/strict-boolean-expressions': 'off',
            '@typescript-eslint/consistent-type-imports': 'error',
            '@typescript-eslint/method-signature-style': 'error',
            '@typescript-eslint/ban-ts-comment': 'error',
            '@typescript-eslint/prefer-optional-chain': 'error',
            '@typescript-eslint/no-var-requires': 'warn',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],

            // Stylistic rules
            '@stylistic/comma-dangle': 'off',
            '@stylistic/indent': 'off',

            // React rules
            'react/react-in-jsx-scope': 'off',

            // React Hooks rules
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'error',

            // ESLint React rules
            // `@eslint-react` plugin is defined in `eslintReactPlugin.configs.recommended`
            '@eslint-react/no-context-provider': 'off',
            // We have not switched to 19 yet! Remove in a major React upgrade (when we no longer support React <19)
            '@eslint-react/no-use-context': 'off',
            '@eslint-react/no-forward-ref': 'off',

            // SonarJS rules
            // `sonarjs` plugin is defined in `sonarjsPlugin.configs.recommended`
            'sonarjs/new-cap': 'off',
            'sonarjs/deprecation': 'warn',
            'sonarjs/function-return-type': 'off',
            'sonarjs/no-empty-test-file': 'off',
            'sonarjs/cognitive-complexity': 'error',
            'sonarjs/prefer-immediate-return': 'off',
            'sonarjs/todo-tag': 'warn',

            // JSDoc rules
            'jsdoc/require-description': 'error',
            'jsdoc/check-tag-names': [
                'error',
                {
                    definedTags: [
                        'group',
                        'category',
                        'remarks',
                        'example',
                        'experimental',
                    ],
                },
            ],

            // Unicorn rules
            // `unicorn` plugin is defined in `unicornPlugin.configs.recommended`
            'unicorn/no-array-callback-reference': 'off',
            'unicorn/prefer-module': 'off',
            'unicorn/no-null': 'off',
            'unicorn/no-unreadable-iife': 'error',
            'unicorn/no-keyword-prefix': 'off',
            'unicorn/prefer-ternary': ['error', 'only-single-line'],
            'unicorn/prevent-abbreviations': [
                'error',
                {
                    replacements: {
                        dev: false,
                        doc: false,
                        Props: false,
                        props: false,
                        param: false,
                        ref: false,
                        params: false,
                        args: false,
                        vars: false,
                        env: false,
                        class: false,
                        ctx: false,
                        db: false,
                        cb: false,
                        refs: false,
                    },
                },
            ],
        },
    },
]);
