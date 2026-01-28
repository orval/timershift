const { defineConfig } = require("eslint/config");
const js = require("@eslint/js");
const globals = require("globals");
const tseslint = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");
const importPlugin = require("eslint-plugin-import");
const promisePlugin = require("eslint-plugin-promise");
const tailwindcss = require("eslint-plugin-tailwindcss");

const tailwindcssFlatConfigs = tailwindcss.configs?.["flat/recommended"];
const tailwindcssConfigs = Array.isArray(tailwindcssFlatConfigs) ? tailwindcssFlatConfigs : [];

// Apply the TypeScript flat configs and layer project-specific settings on top
const tsConfigs = tseslint.configs["flat/recommended-type-checked"].map(
    (config) => ({
        ...config,
        files: ["src/**/*.{ts,tsx,cts,mts}"],
        languageOptions: {
            ...(config.languageOptions ?? {}),
            parser: tsParser,
            parserOptions: {
                ...(config.languageOptions?.parserOptions ?? {}),
                project: "./tsconfig.json",
                tsconfigRootDir: __dirname,
            },
            globals: {
                ...globals.browser,
                ...globals.node,
                __TAURI__: "readonly",
            },
        },
    }),
);

module.exports = defineConfig([
    ...tailwindcssConfigs,
    {
        ignores: [
            "**/dist/**",
            "**/coverage/**",
            "src-tauri/target/**",
            "**/.yarn/**",
            "**/node_modules/**",
            "**/.pnp.cjs",
            "**/.pnp.loader.mjs",
        ],
    },
    {
        ...js.configs.recommended,
        files: ["src/**/*.{js,jsx}"],
        languageOptions: {
            ...js.configs.recommended.languageOptions,
            globals: {
                ...globals.browser,
                ...globals.node,
                __TAURI__: "readonly",
            },
        },
    },
    ...tsConfigs,
    {
        files: ["src/**/*.{js,jsx,ts,tsx,cts,mts}"],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: "./tsconfig.json",
                tsconfigRootDir: __dirname,
            },
            globals: {
                ...globals.browser,
                ...globals.node,
                __TAURI__: "readonly",
            },
        },
        plugins: {
            "@typescript-eslint": tseslint,
            import: importPlugin,
            promise: promisePlugin,
            tailwindcss,
        },
        settings: {
            "import/resolver": {
                typescript: true,
                node: {
                    extensions: [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"],
                },
            },
            tailwindcss: {
                config: "tailwind.config.cjs",
                callees: ["clsx", "classnames", "cn"],
            },
        },
        rules: {
            ...importPlugin.configs.recommended.rules,
            ...(importPlugin.configs.typescript?.rules ?? {}),
            ...promisePlugin.configs.recommended.rules,
            "tailwindcss/classnames-order": "warn",
            "tailwindcss/no-contradicting-classname": "error",
            "tailwindcss/no-custom-classname": "off",
            semi: ["error", "never"],
        },
    },
]);
