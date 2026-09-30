# @rym-lib/seeder

## 1.9.0

### Minor Changes

- bb7cc76: `Seeder.load` の既存行の取得と新規行の投入をチャンク単位（500 行、列数が多いと縮む）にまとめ、行数に比例していた DB との往復回数を減らした。主キーの重複や DB 側との突き合わせのずれがあるチャンクは、従来どおり 1 行ずつ処理する。一括 INSERT が失敗したら、やり直さずに元の例外をそのまま投げるため、トランザクション内で呼んでもよい

  1.8.x からの振る舞いの違い:

  - 失敗時に残る途中の状態が変わる。一括 INSERT が失敗したチャンクは、INSERT 対象が 1 行も入らず、そのチャンクの UPDATE も実行されない
  - チャンク内では INSERT を先に、UPDATE を後に実行する
  - 発行する文の本数が変わるため、文単位のトリガの発火回数が変わる
  - チャンク内の新規行の `created_at` / `updated_at` は同じ時刻になる
  - DB 側の照合では同じ主キーになる別表記（大文字小文字など）が同じチャンクで新規扱いになる場合、重複キーの例外になる

### Patch Changes

- 58b308a: `placeholder` を指定しないとき、`quote` から既定を決める。`quote` が `` ` ``（未指定を含む）なら `?`、`"` か空なら `$`。これまでは常に `$` で、`quote` も `placeholder` も指定しない MySQL では `$1` が流れて失敗していた。`placeholder` を明示している場合は変わらない。既定のまま SQLite で使っている場合は `$1` から `?` に変わるが、SQLite はどちらでも同じ結果になる
- 16d4960: PostgreSQL（`placeholder` が `$`）で失敗していた 2 つの入力を、失敗しないようにした。

  - 整数型（smallint / integer / bigint）の列に数字の文字列（`'123'`、`'-5'`）を渡すと `bigint = text` で失敗していた。数字の文字列を bigint に変換して渡す
  - 自動採番（SERIAL など）の主キーに null を渡すと NOT NULL 違反になっていた。主キーが NOT NULL の列で値が null の行は、INSERT の列から主キーを外して DB の既定値（採番）に任せる。主キーが NULL 可の列は、これまでどおり null を入れる

  `placeholder` が `$` のときだけ、数字の文字列か null の主キーを含む `load` で `information_schema.columns` を 1 回読んで列の型と NOT NULL を調べる。どちらも含まない `load` と、`placeholder` が `?` の場合は SELECT が増えず、発行する SQL も変わらない。一括 INSERT では、主キー列を外す行と外さない行の連続した区間ごとに INSERT を分け、1 行ずつ処理したときと同じ採番順になる。`information_schema` を読めない場合（SQLite など）は、これまでどおりに動く

  主キーが null の行を含むチャンクは INSERT が複数本に分かれる。後の文が失敗すると前の文で入れた行だけが残る（修正前は失敗していた入力に限る）。

## 1.8.1

### Patch Changes

- b2e3747: PostgreSQL で使うときの不具合を修正

  主キーの行が既にあり、null を含む値で更新するとき、UPDATE のプレースホルダと値の数がずれて失敗していた。null の値も正しく渡すようにし、`Value` 型に `null` を加えた

## 1.8.0

### Minor Changes

- 全公開パッケージのバージョンを 1.8.0 に揃える

  `@rym-lib/rdb-command` の 1.8.0 リリースに合わせ、他の公開パッケージも 1.7.1 → 1.8.0 に揃える（このリポジトリはモノレポ全体でバージョンを横並びに保つ運用のため）。機能変更はなくバージョン統一のための bump。

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

## 0.0.14

### Patch Changes

- bump up

## 0.0.13

### Patch Changes

- bump up

## 0.0.12

### Patch Changes

- bump up

## 0.0.11

### Patch Changes

- bump up

## 0.0.10

### Patch Changes

- bump up

## 0.0.9

### Patch Changes

- bump up

## 0.0.7

### Patch Changes

- bump up v0.0.7
- Updated dependencies
  - @rym-lib/exception@0.0.7
  - @rym-lib/inversify-bundler@0.0.7
  - @rym-lib/nakadachi@0.0.7
