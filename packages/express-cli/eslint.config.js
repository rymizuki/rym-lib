/** @type {import('eslint').Linter.Config} */
module.exports = {
  languageOptions: {
    parserOptions: {
      project: ['./tsconfig.json'],
      tsconfigRootDir: __dirname,
    },
  },
}