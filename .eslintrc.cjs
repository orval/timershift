module.exports = {
  root: true,
  env: { browser: true, node: true, es2021: true },
  extends: ['standard-with-typescript'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname
  },
  ignorePatterns: ['dist', 'src-tauri/target'],
  globals: { __TAURI__: 'readonly' }
}
