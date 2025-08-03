import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
    { ignores: ["dist"] },
    {
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
        },
        plugins: {
            "react-hooks": reactHooks,
            "react-refresh": reactRefresh,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            "react-refresh/only-export-components": [
                "warn",
                { allowConstantExport: true },
            ],
            indent: ["error", 4, { SwitchCase: 1 }],
            "space-before-function-paren": ["error", "never"],
            "no-console": ["error", { allow: ["warn"] }],
            "object-curly-spacing": [
                "error",
                "always",
                { objectsInObjects: false },
            ],
            "no-constant-condition": ["off"],
            "no-undef": ["error"],
            "no-unused-vars": ["error", { vars: "local", args: "none" }],
            quotes: ["error", "single"],
            semi: ["error", "always"],
            "no-prototype-builtins": ["off"],
        },
    },
);
