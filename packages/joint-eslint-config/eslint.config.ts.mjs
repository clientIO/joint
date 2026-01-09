import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import { defineConfig } from 'eslint/config';
import { commonRules } from './eslint.config.js.mjs';

/**
 * TypeScript config to support all TypeScript files with .ts, .tsx, .mts extensions
 */
export const tsConfig = defineConfig([
    {
        // TypeScript base config - applies to all .ts, .tsx, .mts files
        files: ['**/*.ts', '**/*.tsx', '**/*.mts'],
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
        extends: [js.configs.recommended, '@typescript-eslint/recommended'],
        rules: {
            // Reuse common rules from JavaScript config
            ...commonRules,
            // Import Plugin Rules
            // Disable unresolved import checking (IDE handles this)
            'import/no-unresolved': ['off'],
            // Disable namespace checking (IDE handles this)
            'import/namespace': ['off'],

            // TypeScript ESLint Rules
            // Allow empty object types (e.g., {})
            '@typescript-eslint/no-empty-object-type': ['off'],
            // Disable unused vars checking (handled by project configs)
            '@typescript-eslint/no-unused-vars': ['off'],
            // Enforce separate type imports for better tree-shaking and clarity
            '@typescript-eslint/consistent-type-imports': [
                'error',
                {
                    prefer: 'type-imports',
                    fixStyle: 'separate-type-imports',
                },
            ],
        },
    },
]);


