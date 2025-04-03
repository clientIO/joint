import { defineConfig, globalIgnores } from 'eslint/config';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([globalIgnores(['**/node_modules', 'scripts', 'dist', 'build']), {
    files: ['**/*.js', '**/*.mjs'],
    extends: compat.extends('../../../eslint.config.mjs'),

    plugins: {
        '@typescript-eslint': typescriptEslint,
    },

    languageOptions: {
        globals: {
            ...globals.mocha,
            joint: true,
            V: true,
            g: true,
            $: true,
            _: true,
            QUnit: true,
            sinon: true,
            blanket: true,
            simulate: true,
            fixtures: true,
        },

        parser: tsParser,
    },
}, {
    files: ['ts/*.ts'],
    extends: compat.extends('plugin:@typescript-eslint/recommended'),

    rules: {
        'prefer-const': 'off',
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
    },
}]);
