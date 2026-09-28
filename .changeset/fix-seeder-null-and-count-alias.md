---
'@rym-lib/seeder': patch
'@rym-lib/query-module-sql-builder': patch
---

PostgreSQL で使うときの不具合を 2 件修正

- `@rym-lib/seeder`: 主キーの行が既にあり、null を含む値で更新するとき、UPDATE のプレースホルダと値の数がずれて失敗していた。null の値も正しく渡すようにし、`Value` 型に `null` を加えた
- `@rym-lib/query-module-sql-builder`: 件数クエリ（`count()`）の別名がバッククォートで固定されていたため、PostgreSQL で構文エラーになっていた。別名を引用符なしの `count` にした
