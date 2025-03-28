import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
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
    extends: compat.extends("eslint:recommended"),

    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
            Uint8Array: true,
            CDATASection: true,
        },

        ecmaVersion: 2022,
        sourceType: "module",
    },

    rules: {
        indent: ["error", 4, {
            SwitchCase: 1,
        }],

        "space-before-function-paren": ["error", "never"],

        "no-console": ["error", {
            allow: ["warn"],
        }],

        "object-curly-spacing": ["error", "always", {
            objectsInObjects: false,
        }],

        "no-constant-condition": ["off"],
        "no-undef": ["error"],

        "no-unused-vars": ["error", {
            vars: "local",
            args: "none",
        }],

        quotes: ["error", "single"],
        semi: ["error", "always"],
        "no-prototype-builtins": ["off"],
    },
}]);
