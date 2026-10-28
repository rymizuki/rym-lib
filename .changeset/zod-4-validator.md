---
'@rym-lib/nakadachi-interactor-mixin-validator': major
---

zod 4 に対応した。peerDependencies の zod を `>=3.0.0` から `>=4.6.6` に上げる。

zod 4.6.6 未満には、制約付きの大きなコレクションを検証するときにメモリを使い果たす脆弱性（GHSA-mrhx-c7xc-m3w5）があり、zod 3 系には修正版がないため。

- `InvalidParameterRequestException#issues` の型を、zod 4 の `z.core.$ZodIssue[]` にした。中身も zod 4 の形式になり、issue の `code` 名や `message` の文言が zod 3 と変わる。issues を読んでエラー表示を組み立てている場合は確認が必要
- `validate` の型引数の制約を、zod 4 で非推奨になった `ZodSchema` から `ZodType` に変えた
- `validate` に `z.array` や `z.record` のスキーマを渡したとき、戻り値の型がそのスキーマの出力型になるようにした
- 対応するのは `zod`（classic）から import したスキーマだけで、`zod/mini` のスキーマは渡せない

移行: アプリの zod を 4.6.6 以上に上げ、スキーマを zod 4 の書き方に移行してから更新する。zod 3 からの変更点は https://zod.dev/v4/changelog を参照。
