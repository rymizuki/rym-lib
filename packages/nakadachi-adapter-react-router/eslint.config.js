/** @type {import('eslint').Linter.Config} */
module.exports = [
  {
    ignores: ['build/**/*'],
  },
  {
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
    },
  },
]
