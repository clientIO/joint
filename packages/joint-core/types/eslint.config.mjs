import { defineConfig, globalIgnores } from "eslint/config";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([globalIgnores(["**/node_modules", "scripts", "dist", "build"]), {
    files: ["**/*.js", "**/*.mjs"],
    extends: compat.extends("../.eslintrc.js", "plugin:@typescript-eslint/recommended"),

    plugins: {
        "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
        parser: tsParser,
    },

    rules: {
        "comma-spacing": "off",
        "@typescript-eslint/comma-spacing": ["error"],
        "space-before-function-paren": "off",
        "@typescript-eslint/space-before-function-paren": ["error", "never"],
        semi: "off",
        "@typescript-eslint/semi": ["error", "always"],
        "object-curly-spacing": "off",

        "@typescript-eslint/object-curly-spacing": ["error", "always", {
            objectsInObjects: false,
        }],

        "semi-spacing": ["error", {
            before: false,
            after: true,
        }],

        "space-in-parens": ["error", "never"],

        "@typescript-eslint/type-annotation-spacing": ["error", {
            after: true,
        }],

        "@typescript-eslint/member-delimiter-style": ["error", {
            multilineDetection: "brackets",

            overrides: {
                interface: {
                    multiline: {
                        delimiter: "semi",
                        requireLast: true,
                    },

                    singleline: {
                        delimiter: "semi",
                        requireLast: true,
                    },
                },

                typeLiteral: {
                    multiline: {
                        delimiter: "semi",
                        requireLast: true,
                    },

                    singleline: {
                        delimiter: "comma",
                        requireLast: false,
                    },
                },
            },
        }],
    },
}, {
    files: ["./**/*"],

    rules: {
        "no-var": "off",
        "@typescript-eslint/no-empty-interface": "off",
        "@typescript-eslint/ban-types": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/triple-slash-reference": "off",
    },
}]);
