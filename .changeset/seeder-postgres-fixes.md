---
'@rym-lib/seeder': patch
---

PostgreSQL（`placeholder` が `$`）で失敗していた 2 つの入力を、失敗しないようにした。

- 整数型（smallint / integer / bigint）の列に数字の文字列（`'123'`、`'-5'`）を渡すと `bigint = text` で失敗していた。数字の文字列を bigint に変換して渡す
- 自動採番（SERIAL など）の主キーに null を渡すと NOT NULL 違反になっていた。主キーが NOT NULL の列で値が null の行は、INSERT の列から主キーを外して DB の既定値（採番）に任せる。主キーが NULL 可の列は、これまでどおり null を入れる

`placeholder` が `$` のときだけ、数字の文字列か null の主キーを含む `load` で `information_schema.columns` を 1 回読んで列の型と NOT NULL を調べる。どちらも含まない `load` と、`placeholder` が `?` の場合は SELECT が増えず、発行する SQL も変わらない。一括 INSERT では、主キー列を外す行と外さない行の連続した区間ごとに INSERT を分け、1 行ずつ処理したときと同じ採番順になる。`information_schema` を読めない場合（SQLite など）は、これまでどおりに動く
