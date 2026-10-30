# @rym-lib/nakadachi-adapter-react-router

## 2.1.0

### Minor Changes

- faf5965: 依存の下限を、既知の脆弱性が修正された版に上げた。

  - `@rym-lib/nakadachi-adapter-react-router`: react-router を `^7.8.0` から `^7.18.2` に上げた。`7.18.2` 未満の react-router には、turbo-stream のデシリアライズによる RCE（GHSA-49rj-9fvp-4h2h）や DoS などサーバー側で効くものを含む 13 件の脆弱性があり、すべて `7.18.2` で修正されている。このアダプターを更新するときは、アプリの react-router も `7.18.2` 以上に上げる必要がある。なお、古い react-router との組み合わせを拒否するのは npm の既定の設定だけで、pnpm や yarn では警告にとどまり、npm の `--legacy-peer-deps` では警告も出ない
  - `@rym-lib/nakadachi-adapter-react-router`: qs を `^6.13.0` から `^6.16.1` に上げた。`6.16.0` 未満の qs には DoS（GHSA-4mjr-xmp4-gh2g）、`6.14.2`〜`6.15.3` には配列上限の回避（GHSA-x5fp-wj9c-mxmx）がある。どちらもこのアダプターが使っていないオプション（`plainObjects` / `allowPrototypes` / `comma`）で発動するため、アダプター経由では起きないが、監査で検出されない版に揃える

## 1.9.0

### Minor Changes

- 全公開パッケージのバージョンを 1.9.0 に揃える（モノレポ全体のバージョン横並び運用のため。seeder 以外は機能変更なし）

## 1.8.1

### Patch Changes

- 全公開パッケージのバージョンを 1.8.1 に揃える

  `@rym-lib/seeder` と `@rym-lib/query-module-sql-builder` の 1.8.1 リリースに合わせ、他の公開パッケージも 1.8.0 → 1.8.1 に揃える（このリポジトリはモノレポ全体でバージョンを横並びに保つ運用のため）。機能変更はなくバージョン統一のための bump。

## 1.8.0

### Minor Changes

- 全公開パッケージのバージョンを 1.8.0 に揃える

  `@rym-lib/rdb-command` の 1.8.0 リリースに合わせ、他の公開パッケージも 1.7.1 → 1.8.0 に揃える（このリポジトリはモノレポ全体でバージョンを横並びに保つ運用のため）。機能変更はなくバージョン統一のための bump。

## 1.7.1

### Patch Changes

- fix(seeder): bigint型の主キー・カラムに対応
- Updated dependencies
  - @rym-lib/nakadachi@1.7.1

## 1.7.0

### Minor Changes

- feat(query-module): add count method

### Patch Changes

- Updated dependencies
  - @rym-lib/nakadachi@1.7.0

## 1.6.0

### Minor Changes

- update seeder

### Patch Changes

- Updated dependencies
  - @rym-lib/nakadachi@1.6.0

## 1.5.0

### Minor Changes

- update inversify to v7

### Patch Changes

- Updated dependencies
  - @rym-lib/nakadachi@1.5.0

## 1.4.7

### Patch Changes

- fix rdb-command
- Updated dependencies
  - @rym-lib/nakadachi@1.4.7

## 1.4.6

### Patch Changes

- fix bugs for seeder
- Updated dependencies
  - @rym-lib/nakadachi@1.4.6

## 1.4.5

### Patch Changes

- fix rdb-command interface
- Updated dependencies
  - @rym-lib/nakadachi@1.4.5

## 1.4.4

### Patch Changes

- fix bugs
- Updated dependencies
  - @rym-lib/nakadachi@1.4.4

## 1.4.3

### Patch Changes

- fix install
- Updated dependencies
  - @rym-lib/nakadachi@1.4.3

## 1.4.2

### Patch Changes

- fixes for ci
- Updated dependencies
  - @rym-lib/nakadachi@1.4.2

## 1.4.1

### Patch Changes

- minimum changes
- Updated dependencies
  - @rym-lib/nakadachi@1.4.1

## 1.4.0

### Minor Changes

- add sync method with rdb-command

### Patch Changes

- Updated dependencies
  - @rym-lib/nakadachi@1.4.0

## 1.3.3

### Patch Changes

- fix dependencies version
- Updated dependencies
  - @rym-lib/nakadachi@1.3.3

## 1.2.10

### Patch Changes

- fix: remove isRawSqlExpression to prevent incorrect field name handling #55
- Updated dependencies
  - @rym-lib/nakadachi@1.2.10

## 1.2.9

### Patch Changes

- feat(query-module): add comprehensive test coverage and fix function-based rules implementation #54
- Updated dependencies
  - @rym-lib/nakadachi@1.2.9

## 1.2.8

### Patch Changes

- fix: correct customFilter test expectations #52
- Updated dependencies
  - @rym-lib/nakadachi@1.2.8

## 1.2.7

### Patch Changes

- feat(query-module): support SQL expression objects in function-based rules #51
- Updated dependencies
  - @rym-lib/nakadachi@1.2.7

## 1.2.6

### Patch Changes

- feat(query-module): add function-based rules support #50
- Updated dependencies
  - @rym-lib/nakadachi@1.2.6

## 1.2.5

### Patch Changes

- fix query-module bugs
- Updated dependencies
  - @rym-lib/nakadachi@1.2.5

## 1.2.4

### Patch Changes

- fix query-module filter type missmatch
- Updated dependencies
  - @rym-lib/nakadachi@1.2.4

## 1.2.3

### Patch Changes

- update query-module
- Updated dependencies
  - @rym-lib/nakadachi@1.2.3

## 1.0.0

### Major Changes

- create package nakdachi-adapter-react-router
