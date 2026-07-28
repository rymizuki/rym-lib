---
'@rym-lib/rdb-command': minor
---

原子的な `upsert`（`INSERT ... ON CONFLICT`）API を追加

直 SQL を書かずに ON CONFLICT を表現できるよう、`DataBase.upsert(table, data, conflict, options?)` を追加した。既存の `updateOrCreate` は SELECT → create/update の非原子的 2 ステップで競合に無防備だったが、`upsert` は単一クエリで原子的に実行する。

- `raw(sql, ...bindings)` sentinel により、SQL 式とバインド値の混在（`?::uuid` / `?::jsonb` / `now()` / `ST_SetSRID(ST_MakePoint(?, ?), 4326)` 等）を表現できる。
- ショートハンド `now()` / `null_value()` / `cast(value, type)` を追加。命名は coral-sql（`coalesce` / `json_object` 等）のトップレベル snake_case に揃えた。
- `DO NOTHING` / `DO UPDATE SET`（excluded 列リスト・明示値の両対応）/ 部分 unique index（`ON CONFLICT (...) WHERE ...`）/ `RETURNING` に対応。
- PostgreSQL 専用（MySQL の `?` placeholder では例外を throw）。複数行バルク VALUES は将来対応。
- 既存 `create` / `update` / `delete` / `sync` / `updateOrCreate` の SQL 生成は変更していない（後方互換）。
