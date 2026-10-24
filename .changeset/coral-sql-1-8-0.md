---
'@rym-lib/query-module-sql-builder': minor
'@rym-lib/rdb-command': minor
---

coral-sql を `^1.5.3` から `^1.8.0` に上げた。`@rym-lib/rdb-command` の peerDependencies も `*` から `^1.8.0` にした。

1.6.0〜1.8.0 で入った SQL injection 対策を取り込むための更新で、生成される SQL と例外の条件が変わる。詳細は coral-sql の CHANGELOG を参照。

- case_when の THEN / ELSE の文字列と json_object のキーが、SQL に直接埋め込まれずバインドされる
- 識別子に含まれるクォート文字を二重化する。`'name'` のように、設定と違うクォート文字で囲んだ識別子は素通しせずクォートし直す
- limit() / offset() に 0 以上の安全な整数以外を渡すと例外を投げる。criteria の `take` / `skip`、pagination の `page` / `rows` に数値文字列（クエリパラメータの `'10'` など）を渡している場合は、`Number()` で変換してから渡す
- 未対応の演算子を where() に渡すと例外を投げる
- `SQLBuilderConditionExpressionPort` を自前で実装している場合は、値を `options.bindings.create()` で共有の bindings に積む必要がある
- 文字列の select() と join の ON 条件は非推奨になった（動作は変わらない）
