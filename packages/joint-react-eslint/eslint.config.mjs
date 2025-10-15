import jsdoc from "eslint-plugin-jsdoc";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import tsParser from "@typescript-eslint/parser";
import stylisticJsx from "@stylistic/eslint-plugin-jsx";
import stylisticTs from "@stylistic/eslint-plugin-ts";
import stylistic from "@stylistic/eslint-plugin";
import unicorn from "eslint-plugin-unicorn";
import jest from "eslint-plugin-jest";
import sonarjs from "eslint-plugin-sonarjs";
import * as depend from "eslint-plugin-depend";
import reactHooks from "eslint-plugin-react-hooks";
import reactPerfPlugin from "eslint-plugin-react-perf";
import eslintReact from "@eslint-react/eslint-plugin";
import { fixupPluginRules } from "@eslint/compat";
import path from "node:path";

const tsConfigPath = path.resolve("./", "tsconfig.json");

/** @type {import('eslint').Linter.Config[]} */
const config = [
  // Global ignores
  {
    ignores: ["node_modules", "dist", "bundle-dist", "tsconfig.json"],
  },

  // Base recommended configs
  js.configs.recommended,
  jsdoc.configs["flat/recommended-typescript"],
  ...tseslint.configs.strict,
  depend.configs["flat/recommended"],
  eslintReact.configs.recommended,
  unicorn.configs["flat/recommended"],
  reactPerfPlugin.configs.flat.recommended,
  sonarjs.configs.recommended,
  {
    files: [
      "**/*.stories.*",
      "**/*.test.*",
      "**/stories/**/*.{ts,tsx}",
      ".storybook/**/*.{ts,tsx}",
    ],
    rules: {
      "jsdoc/require-jsdoc": "off",
      "jsdoc/check-alignment": "off",
      "jsdoc/check-indentation": "off",
      "jsdoc/check-param-names": "off",
      "jsdoc/check-tag-names": "off",
      "jsdoc/check-types": "off",
      "jsdoc/implements-on-classes": "off",
      "jsdoc/match-description": "off",
      "jsdoc/newline-after-description": "off",
      "jsdoc/no-types": "off",
      "jsdoc/require-description": "off",
      "jsdoc/require-param": "off",
      "jsdoc/require-returns": "off",
      "jsdoc/valid-types": "off",
    },
  },
  // Main rules for project files
  {
    files: ["src/**/*.{ts,tsx}", ".storybook/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
        project: tsConfigPath,
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    plugins: {
      jest,
      ts: tseslint,
      "@stylistic": stylistic,
      "@stylistic/ts": stylisticTs,
      "@stylistic/jsx": stylisticJsx,
      "react-hooks": fixupPluginRules(reactHooks),
    },
    rules: {
      // General JS rules
      "no-console": "error",
      "no-nested-ternary": "warn",
      "no-shadow": "error",
      "no-unused-vars": "off",
      "prefer-destructuring": "error",
      camelcase: "error",
      "object-shorthand": "error",
      "no-unneeded-ternary": "error",

      // TypeScript-specific rules
      "@typescript-eslint/array-type": ["error", { default: "array-simple" }],
      "@typescript-eslint/no-shadow": "error",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/strict-boolean-expressions": "off",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/method-signature-style": "error",
      "@typescript-eslint/ban-ts-comment": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/no-var-requires": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // Stylistic rules
      "@stylistic/comma-dangle": "off",
      "@stylistic/indent": "off",

      // React
      "react/react-in-jsx-scope": "off",

      // React Hooks
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": [
        "error",
        {
          additionalHooks: "",
        },
      ],

      // ESLint React Plugin
      "@eslint-react/no-context-provider": "off",

      // SonarJS
      "sonarjs/new-cap": "off",
      "sonarjs/deprecation": "warn",
      "sonarjs/function-return-type": "off",
      "sonarjs/no-empty-test-file": "off",
      "sonarjs/cognitive-complexity": "error",
      "sonarjs/prefer-immediate-return": "off",
      "sonarjs/todo-tag": "warn",
      // We do not switch to 19 yet! Remove in major React upgrade (with not support for lower version than react 19!)
      "@eslint-react/no-use-context": "off",
      "@eslint-react/no-forward-ref": "off",

      // JSDoc
      "jsdoc/require-description": "error",
      "jsdoc/check-tag-names": [
        "error",
        {
          definedTags: [
            "group",
            "category",
            "remarks",
            "example",
            "experimental",
            // add other TypeDoc-specific tags you use
          ],
        },
      ],

      // Unicorn
      "unicorn/no-array-callback-reference": "off",
      "unicorn/prefer-module": "off",
      "unicorn/no-null": "off",
      "unicorn/no-unreadable-iife": "error",
      "unicorn/no-keyword-prefix": "off",
      "unicorn/prefer-ternary": ["error", "only-single-line"],
      "unicorn/prevent-abbreviations": [
        "error",
        {
          replacements: {
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
];

export default config;
