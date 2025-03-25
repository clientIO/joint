import { defineConfig, globalIgnores } from "eslint/config";
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
    extends: compat.extends("../.eslintrc.js"),

    languageOptions: {
        globals: {
            joint: true,
            g: true,
            V: true,
            $: true,
            Vue: true,
            d3: true,
        },

        ecmaVersion: "2022",
        sourceType: "script",
    },
}, {
    files: [
        "rough/src/rough.js",
        "ports/port-z-index.js",
        "ports/port-layouts-defaults.js",
        "expand/expand.paper.js",
        "chess/src/garbochess.js",
        "vuejs/demo.js",
        "petri-nets/src/pn.js",
        "org/src/org.js",
        "**/custom-router.js",
        "archive/links.js",
        "embedding/nested-clone.js",
        "expand/index.js",
        "expand/shapes.js",
        "vectorizer/vectorizer.js",
    ],

    languageOptions: {
        globals: {
            rough: true,
            createPaper: true,
            paper: true,
        },
    },

    rules: {
        "no-redeclare": ["off"],
        "no-unused-vars": ["off"],
        "no-console": ["off"],
    },
}]);