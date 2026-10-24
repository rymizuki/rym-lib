---
'@rym-lib/query-module-sql-builder': minor
'@rym-lib/rdb-command': minor
'@rym-lib/query-module-driver-prisma': minor
'@rym-lib/query-module-driver-sequelize': minor
---

coral-sql を `^1.5.3` から `^1.8.0` に上げた。`@rym-lib/rdb-command` の peerDependencies も `*` から `^1.8.0` にした。

1.6.0〜1.8.0 で入った SQL injection 対策を取り込むための更新で、生成される SQL と例外の条件が変わる。詳細は coral-sql の CHANGELOG を参照。

- case_when の THEN / ELSE の文字列と json_object のキーが、SQL に直接埋め込まれずバインドされる（PostgreSQL では json_object のキーが `$N::text` になる）。同じ case_when / json_object を SELECT と GROUP BY の両方に置いている場合、PostgreSQL では両者のプレースホルダの番号が別になるため、同じ式とみなされず `must appear in the GROUP BY clause` になりうる
- case_when / coalesce を WHERE で使うとバインド値が消えていた不具合が直った。case_when の when() に `in` / `not in` / `between` と配列を渡したときの SQL は `IN (?,?)` / `NOT IN (?,?)` / `BETWEEN ? AND ?` になる
- 識別子に含まれるクォート文字を二重化する。`'name'` のように、設定と違うクォート文字で囲んだ識別子は素通しせずクォートし直す。二重化済みのクォート文字を含む識別子（`` `a``b` `` / `"a""b"`）ももう一度二重化するので、エスケープ済みの値を渡していた場合はエスケープ前の値（`` a`b `` / `a"b`）を渡す
- limit() / offset() に 0 以上の安全な整数以外を渡すと例外を投げる。criteria の `take` / `skip`、`@rym-lib/query-module-pagination` の `page` / `rows` に数値文字列（クエリパラメータの `'10'` など）を渡している場合は、`Number()` で変換してから渡す
- 未対応の演算子を where() に渡すと例外を投げる
- `SQLBuilderConditionExpressionPort` を自前で実装している場合は、値を `options.bindings.create()` で共有の bindings に積む必要がある
- 文字列の select() と join の ON 条件は非推奨になった（文字列を渡したときの動作は変わらない）。ON 条件に exists() / column_ref() / Field や空の条件を渡すと例外を投げる
- `SQLBuilderPort` を自前で実装している場合は、select と ON 条件に RawSQLPort / Conditions を受け取る overload が必要
- unescape() の戻り値の型が RawSQLPort になった。その戻り値を受けた変数に column_ref() や Field を再代入している場合は、型注釈を FieldPort に広げる
