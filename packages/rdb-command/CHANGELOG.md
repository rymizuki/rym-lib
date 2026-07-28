# @rym-lib/rdb-command

## 1.8.0

### Minor Changes

- 579a991: 原子的な `upsert`（`INSERT ... ON CONFLICT`）API を追加

  直 SQL を書かずに ON CONFLICT を表現できるよう、`DataBase.upsert(table, data, conflict, options?)` を追加した。既存の `updateOrCreate` は SELECT → create/update の非原子的 2 ステップで競合に無防備だったが、`upsert` は単一クエリで原子的に実行する。

  - `raw(sql, ...bindings)` sentinel により、SQL 式とバインド値の混在（`?::uuid` / `?::jsonb` / `now()` / `ST_SetSRID(ST_MakePoint(?, ?), 4326)` 等）を表現できる。
  - ショートハンド `now()` / `null_value()` / `cast(value, type)` を追加。命名は coral-sql（`coalesce` / `json_object` 等）のトップレベル snake_case に揃えた。
  - `DO NOTHING` / `DO UPDATE SET`（excluded 列リスト・明示値の両対応）/ 部分 unique index（`ON CONFLICT (...) WHERE ...`）/ `RETURNING` に対応。
  - PostgreSQL 専用（MySQL の `?` placeholder では例外を throw）。複数行バルク VALUES は将来対応。
  - 既存 `create` / `update` / `delete` / `sync` / `updateOrCreate` の SQL 生成は変更していない（後方互換）。

## 1.7.1

### Patch Changes

- fix(seeder): bigint型の主キー・カラムに対応

## 1.7.0

### Minor Changes

- feat(query-module): add count method

## 1.6.0

### Minor Changes

- update seeder

## 1.5.0

### Minor Changes

- update inversify to v7

## 1.4.7

### Patch Changes

- fix rdb-command

## 1.4.6

### Patch Changes

- fix bugs for seeder

## 1.4.5

### Patch Changes

- fix rdb-command interface

## 1.4.4

### Patch Changes

- fix bugs

## 1.4.3

### Patch Changes

- fix install

## 1.4.2

### Patch Changes

- fixes for ci

## 1.4.1

### Patch Changes

- minimum changes

## 1.4.0

### Minor Changes

- add sync method with rdb-command

## 1.3.3

### Patch Changes

- fix dependencies version

## 1.3.1

### Patch Changes

- update dependencies and fix type problemns

## 1.3.0

### Minor Changes

- update query-module implementaions and breaking changes

## 1.2.10

### Patch Changes

- fix: remove isRawSqlExpression to prevent incorrect field name handling #55

## 1.2.9

### Patch Changes

- feat(query-module): add comprehensive test coverage and fix function-based rules implementation #54

## 1.2.8

### Patch Changes

- fix: correct customFilter test expectations #52

## 1.2.7

### Patch Changes

- feat(query-module): support SQL expression objects in function-based rules #51

## 1.2.6

### Patch Changes

- feat(query-module): add function-based rules support #50

## 1.2.5

### Patch Changes

- fix query-module bugs

## 1.2.4

### Patch Changes

- fix query-module filter type missmatch

## 1.2.3

### Patch Changes

- update query-module

## 1.2.2

### Patch Changes

- update nakadachi, query-module

## 1.2.1

### Patch Changes

- Patch release for all packages

## 1.2.0

### Minor Changes

- nakadachi: add feature for middleware hook

## 1.1.4

### Patch Changes

- fix seeder bugs

## 1.1.3

### Patch Changes

- fix sesder bug

## 1.1.2

### Patch Changes

- rdb-command fix bugs

## 1.1.1

### Patch Changes

- fix rdb-command

## 1.1.0

### Minor Changes

- support postgresql for db modules

## 1.0.4

### Patch Changes

- fix support postgresql

## 1.0.3

### Patch Changes

- fix quote setting for rdb-command

## 1.0.2

### Patch Changes

- remove backquote for sqls

## 1.0.1

### Patch Changes

- afdcf5d: update query-module-driver-\*
- c34a966: update query-module-sql-builder

## 1.0.1-alpha.1

### Patch Changes

- update query-module-sql-builder

## 1.0.1-alpha.0

### Patch Changes

- update query-module-driver-\*

## 1.0.0

### Major Changes

- 51023ab: initial release 1.0.0

### Patch Changes

- e8d2223: fix bugs
- 6013328: add tests
- 3332bf4: fix bugs
- 66c9cd9: add features for query-modules
- 96e3994: missing include index.d.mts
- 7ce0a23: update uri package
- fc3b944: add features and fixes
- c86d92c: fix exports settings
- ddf8d6a: update ui
- 331df3c: bump up
- 8f64765: update features
- 5881810: fix bugs
- 3e1a0c5: update packages
- 90fc17b: fix bug
- f9fc090: support minimum feature for nakadachi-adapter-remix
- 7c609ea: add fixes

## 1.0.0-alpha.16

### Patch Changes

- update packages

## 1.0.0-alpha.15

### Patch Changes

- add tests

## 1.0.0-alpha.14

### Patch Changes

- update uri package

## 1.0.0-alpha.13

### Patch Changes

- support minimum feature for nakadachi-adapter-remix

## 1.0.0-alpha.12

### Patch Changes

- missing include index.d.mts

## 1.0.0-alpha.11

### Patch Changes

- fix exports settings

## 1.0.0-alpha.10

### Patch Changes

- update ui

## 1.0.0-alpha.9

### Patch Changes

- fix bug

## 1.0.0-alpha.8

### Patch Changes

- fix bugs

## 1.0.0-alpha.7

### Patch Changes

- add features for query-modules

## 1.0.0-alpha.6

### Patch Changes

- fix bugs

## 1.0.0-alpha.5

### Patch Changes

- update features

## 1.0.0-alpha.4

### Patch Changes

- fix bugs

## 1.0.0-alpha.3

### Patch Changes

- add fixes

## 1.0.0-alpha.2

### Patch Changes

- add features and fixes

## 1.0.0-alpha.1

### Patch Changes

- bump up

## 1.0.0-alpha.0

### Major Changes

- initial release 1.0.0

## 0.0.17

### Patch Changes

- bump up

## 0.0.16

### Patch Changes

- bump

## 0.0.15

### Patch Changes

- bump up
