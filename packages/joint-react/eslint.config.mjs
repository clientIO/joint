import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylisticJsx from '@stylistic/eslint-plugin-jsx';
import stylisticTs from '@stylistic/eslint-plugin-ts';
import unicorn from 'eslint-plugin-unicorn';
import jest from 'eslint-plugin-jest';
import stylistic from '@stylistic/eslint-plugin';
import sonarjs from 'eslint-plugin-sonarjs';
import * as depend from 'eslint-plugin-depend';
import reactHooks from 'eslint-plugin-react-hooks';
import { fixupPluginRules } from '@eslint/compat';
import tsParser from '@typescript-eslint/parser';
import reactPerfPlugin from 'eslint-plugin-react-perf';
import path from 'node:path';
import eslintReact from '@eslint-react/eslint-plugin';

const tsConfigPath = path.resolve('./', 'tsconfig.json');

/** @type {import('eslint').Linter.Config} */
const config = [
  {
    ignores: ['/node_modules/', 'tsconfig.json'],
    files: ['src/**/*.{ts,tsx}', ".storybook/**/*.{ts,tsx}'"],
  },
  depend.configs['flat/recommended'],
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintReact.configs.recommended,
  unicorn.configs['flat/recommended'],
  reactPerfPlugin.configs.flat.recommended,
  sonarjs.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}', ".storybook/**/*.{ts,tsx}'"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { modules: false },
        ecmaVersion: 'latest',
        project: tsConfigPath,
      },
    },
    plugins: {
      jest,
      ts: tseslint,
      '@stylistic': stylistic,
      '@stylistic/ts': stylisticTs,
      '@stylistic/jsx': stylisticJsx,
      'react-hooks': fixupPluginRules(reactHooks),
    },
    rules: {
      // General rules
      'no-console': 'error',
      'no-nested-ternary': 1,
      'no-shadow': 'error',
      'no-unused-vars': 0,
      'prefer-destructuring': 2,
      camelcase: 2,
      'object-shorthand': 2,
      'no-unneeded-ternary': 'error',

      // TypeScript rules

      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
      '@typescript-eslint/no-shadow': 2,
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/method-signature-style': ['error'],
      '@typescript-eslint/ban-ts-comment': ['error'],
      '@typescript-eslint/prefer-optional-chain': ['error'],
      '@typescript-eslint/no-var-requires': ['warn'],
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

      // React and hooks
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',

      '@eslint-react/no-context-provider': 'off',

      // SonarJS
      'sonarjs/new-cap': 'off',
      'sonarjs/deprecation': 'warn',
      'sonarjs/function-return-type': 'off',
      'sonarjs/no-empty-test-file': 'off',
      'sonarjs/cognitive-complexity': 'error',
      'sonarjs/prefer-immediate-return': 0,
      'sonarjs/todo-tag': 'warn',

      // Unicorn
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
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];

export default config;
