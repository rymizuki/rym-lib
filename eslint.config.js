const config = require('@rym-lib/dev-config/eslint')
config.root = true

/** @type {import('eslint').Linter.Config} */
module.exports = {
  ...config,
  languageOptions: {
    parserOptions: {
      project: ['./tsconfig.json'],
      tsconfigRootDir: __dirname,
    },
  },
}
