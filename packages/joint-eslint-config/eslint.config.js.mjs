import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';

/**
 * Common import order configuration for eslint-plugin-import
 * @type {{ groups: string[]; 'newlines-between': string; alphabetize: { order: string; caseInsensitive: boolean } }}
 */
// TODO: Enabled later for imports
// const importOrderConfig = {
//     groups: [
//         'builtin',
//         'external',
//         'internal',
//         'parent',
//         'sibling',
//         'index',
//     ],
//     'newlines-between': 'never',
//     alphabetize: {
//         order: 'asc',
//         caseInsensitive: true,
//     },
// };

/**
 * Common ESLint rules shared between JavaScript and TypeScript files
 * @type {import('eslint').Linter.RulesRecord}
 */
export const commonRules = {
    // ESLint Core Rules
    // Enforce 4-space indentation with special handling for switch cases
    indent: ['error', 4, { SwitchCase: 1 }],
    // Disallow console.log but allow console.warn for debugging
    'no-console': ['error', { allow: ['warn'] }],
    // Allow constant conditions (useful for while(true) loops)
    'no-constant-condition': ['off'],
    // Allow direct prototype builtin access
    'no-prototype-builtins': ['off'],
    // Enforce spaces inside object curly braces, but not between braces
    'object-curly-spacing': ['error', 'always', { objectsInObjects: false }],
    // Enforce single quotes for strings
    quotes: ['error', 'single'],
    // Require semicolons at the end of statements
    semi: ['error', 'always'],
    // Disallow space before function parentheses
    'space-before-function-paren': ['error', 'never'],
    // Enforce const for variables that are never reassigned
    'prefer-const': ['error'],
    // Allow var declarations (legacy code support)
    'no-var': ['off'],

    // Import Plugin Rules
    // Disable namespace checking (IDE handles this)
    // TODO: Enabled later for imports
    // 'import/namespace': ['off'],
    // // Prevent duplicate imports from the same module
    // 'import/no-duplicates': ['error'],
    // // Enforce import ordering according to importOrderConfig
    // 'import/order': ['error', importOrderConfig],
    // // Disable unresolved import checking (IDE handles this)
    // 'import/no-unresolved': 'off',
    // // Allow default exports with same name as module
    // 'import/no-named-as-default': 'off',
    // // Disable default import checking
    // 'import/default': 'off',
    // // Allow named exports with same name as default export
    // 'import/no-named-as-default-member': 'off',
};

/**
 * JavaScript config to support all JavaScript files with .js, .jsx, .mjs extensions
 */
export const jsConfig = defineConfig([
    // Import plugin recommended configuration
    // TODO: Enabled later for imports
    // importPlugin.flatConfigs.recommended,
    {
        // Globally ignored folders - only place with ignores
        ignores: ['build/', 'dist/', 'node_modules/'],
    },
    {
        // Common globals for all checked files
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.mocha,
                ...globals.jest,
            },
        },
    },
    {
        // JavaScript base config - applies to all .js, .jsx, .mjs files
        files: ['**/*.js', '**/*.jsx', '**/*.mjs'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
        },
        extends: [js.configs.recommended],
        settings: {
            'import/resolver': {
                node: {
                    extensions: ['.js', '.mjs', '.cjs', '.json'],
                },
            },
        },
        rules: {
            ...commonRules,
            // Explicitly disable namespace checking for JavaScript files
            // TODO: Enabled later for imports
            // 'import/namespace': ['off'],
            // Report unused variables (local scope only, ignore function arguments)
            'no-unused-vars': ['error', { vars: 'local', args: 'none' }],
        },
    },
]);
