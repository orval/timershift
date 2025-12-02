const {
    defineConfig,
    globalIgnores,
} = require("eslint/config");

const globals = require("globals");
const js = require("@eslint/js");

const {
    FlatCompat,
} = require("@eslint/eslintrc");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

module.exports = defineConfig([{
    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
            __TAURI__: "readonly",
        },

        parserOptions: {
            project: "./tsconfig.json",
            tsconfigRootDir: __dirname,
        },
    },

    extends: compat.extends("standard-with-typescript"),
}, globalIgnores(["**/dist", "src-tauri/target"])]);
