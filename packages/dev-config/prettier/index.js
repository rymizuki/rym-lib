/** @type {import('prettier').Config} */
module.exports = {
  semi: false,
  arrowParens: 'always',
  trailingComma: 'all',
  singleQuote: true,
  importOrder: [
    // すべてのコードの前提となるもの
    `^(${['reflect-metadata'].join('|')})`,
    // 外部ライブラリ
    '^[a-z](.)+$', // import 'xxxx'
    '^@[a-z](.)+$', // import '@xxx/yyy'
    // 内部コード
    '^@styled-system/.+$', // import '@styled-system/xxx'
    '^@/(.+)?$', // import '@/xxx'
    '^~/(.+)?$', // import '~/xxx'
    '^\\.+/(.+)$', // import './xxx'
  ],
  importOrderSeparation: true,
  importOrderGroupNamespaceSpecifiers: true,
  importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
  plugins: ['@trivago/prettier-plugin-sort-imports'],
}
