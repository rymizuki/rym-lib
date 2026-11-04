/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  {
    ignores: ['build/**/*', 'styled-system/**/*'],
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
