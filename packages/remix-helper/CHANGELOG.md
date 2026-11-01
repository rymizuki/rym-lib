# @rym-lib/remix-helper

## 2.1.0

### Major Changes

- 47957fd: `Link`・`useMatches`・`useLocation`・`useNavigate`・`useSearchParams`・`UIMatch` の import 元を `@remix-run/react` から `react-router` に変えた。peerDependencies も `@remix-run/react >=2.0.0` から `react-router >=7.18.0` に変わる。

  Remix 2 が依存する react-router 6 系には、7.18.0 でしか直っていない脆弱性があり、Remix 2 のままでは解消できないため。

  - GHSA-wrjc-x8rr-h8h6: `<Link>` と `useNavigate` に渡したバックスラッシュを含むパスによる open redirect。ui の `LinkFeature` と remix-helper の `useFlashMessage` が直接使う API
  - GHSA-337j-9hxr-rhxg: SSR の hydration でのエラーのデシリアライズ

  移行: アプリを React Router 7 に移行してから更新する（Remix 2 からの移行は React Router の公式ガイドを参照）。`@rym-lib/remix-helper` のパッケージ名は変わらない。

  `RouteHandle<Data>` の型は次の点が変わる。

  - `Data` には loader の戻り値の型を渡す（`typeof loader` ではなく `Awaited<ReturnType<typeof loader>>` や `Route.ComponentProps['loaderData']`）。Remix 2 の `SerializeFrom` による変換（`Date` が `string` になる等）は行われない
  - `breadcrumbs` に渡る `match.data` は `undefined` になりうる型になった。React Router 7 では `data` は非推奨で、`loaderData` を使う

### Patch Changes

- Updated dependencies
  - @rym-lib/utilities@2.1.0

## 1.9.0

### Minor Changes

- 全公開パッケージのバージョンを 1.9.0 に揃える（モノレポ全体のバージョン横並び運用のため。seeder 以外は機能変更なし）

### Patch Changes

- Updated dependencies
  - @rym-lib/utilities@1.9.0

## 1.8.1

### Patch Changes

- 全公開パッケージのバージョンを 1.8.1 に揃える

  `@rym-lib/seeder` と `@rym-lib/query-module-sql-builder` の 1.8.1 リリースに合わせ、他の公開パッケージも 1.8.0 → 1.8.1 に揃える（このリポジトリはモノレポ全体でバージョンを横並びに保つ運用のため）。機能変更はなくバージョン統一のための bump。

- Updated dependencies
  - @rym-lib/utilities@1.8.1

## 1.8.0

### Minor Changes

- 全公開パッケージのバージョンを 1.8.0 に揃える

  `@rym-lib/rdb-command` の 1.8.0 リリースに合わせ、他の公開パッケージも 1.7.1 → 1.8.0 に揃える（このリポジトリはモノレポ全体でバージョンを横並びに保つ運用のため）。機能変更はなくバージョン統一のための bump。

### Patch Changes

- Updated dependencies
  - @rym-lib/utilities@1.8.0

## 1.7.1

### Patch Changes

- fix(seeder): bigint型の主キー・カラムに対応
- Updated dependencies
  - @rym-lib/utilities@1.7.1

## 1.7.0

### Minor Changes

- feat(query-module): add count method

### Patch Changes

- Updated dependencies
  - @rym-lib/utilities@1.7.0

## 1.6.0

### Minor Changes

- update seeder

### Patch Changes

- Updated dependencies
  - @rym-lib/utilities@1.6.0

## 1.5.0

### Minor Changes

- update inversify to v7

### Patch Changes

- Updated dependencies
  - @rym-lib/utilities@1.5.0

## 1.4.7

### Patch Changes

- fix rdb-command
- Updated dependencies
  - @rym-lib/utilities@1.4.7

## 1.4.6

### Patch Changes

- fix bugs for seeder
- Updated dependencies
  - @rym-lib/utilities@1.4.6

## 1.4.5

### Patch Changes

- fix rdb-command interface
- Updated dependencies
  - @rym-lib/utilities@1.4.5

## 1.4.4

### Patch Changes

- fix bugs
- Updated dependencies
  - @rym-lib/utilities@1.4.4

## 1.4.3

### Patch Changes

- fix install
- Updated dependencies
  - @rym-lib/utilities@1.4.3

## 1.4.2

### Patch Changes

- fixes for ci
- Updated dependencies
  - @rym-lib/utilities@1.4.2

## 1.4.1

### Patch Changes

- minimum changes
- Updated dependencies
  - @rym-lib/utilities@1.4.1

## 1.4.0

### Minor Changes

- add sync method with rdb-command

### Patch Changes

- Updated dependencies
  - @rym-lib/utilities@1.4.0

## 1.3.3

### Patch Changes

- fix dependencies version
- Updated dependencies
  - @rym-lib/utilities@1.3.3

## 1.3.1

### Patch Changes

- update dependencies and fix type problemns
- Updated dependencies
  - @rym-lib/utilities@1.3.1

## 1.3.0

### Minor Changes

- update query-module implementaions and breaking changes

### Patch Changes

- Updated dependencies
  - @rym-lib/utilities@1.3.0

## 1.2.10

### Patch Changes

- fix: remove isRawSqlExpression to prevent incorrect field name handling #55
- Updated dependencies
  - @rym-lib/utilities@1.2.10

## 1.2.9

### Patch Changes

- feat(query-module): add comprehensive test coverage and fix function-based rules implementation #54
- Updated dependencies
  - @rym-lib/utilities@1.2.9

## 1.2.8

### Patch Changes

- fix: correct customFilter test expectations #52
- Updated dependencies
  - @rym-lib/utilities@1.2.8

## 1.2.7

### Patch Changes

- feat(query-module): support SQL expression objects in function-based rules #51
- Updated dependencies
  - @rym-lib/utilities@1.2.7

## 1.2.6

### Patch Changes

- feat(query-module): add function-based rules support #50
- Updated dependencies
  - @rym-lib/utilities@1.2.6

## 1.2.5

### Patch Changes

- fix query-module bugs
- Updated dependencies
  - @rym-lib/utilities@1.2.5

## 1.2.4

### Patch Changes

- fix query-module filter type missmatch
- Updated dependencies
  - @rym-lib/utilities@1.2.4

## 1.2.3

### Patch Changes

- update query-module
- Updated dependencies
  - @rym-lib/utilities@1.2.3

## 1.2.2

### Patch Changes

- update nakadachi, query-module
- Updated dependencies
  - @rym-lib/utilities@1.2.2

## 1.2.1

### Patch Changes

- Patch release for all packages
- Updated dependencies
  - @rym-lib/utilities@1.2.1

## 1.2.0

### Minor Changes

- nakadachi: add feature for middleware hook

### Patch Changes

- Updated dependencies
  - @rym-lib/utilities@1.2.0

## 1.1.4

### Patch Changes

- fix seeder bugs
- Updated dependencies
  - @rym-lib/utilities@1.1.4

## 1.1.3

### Patch Changes

- fix sesder bug
- Updated dependencies
  - @rym-lib/utilities@1.1.3

## 1.1.2

### Patch Changes

- rdb-command fix bugs
- Updated dependencies
  - @rym-lib/utilities@1.1.2

## 1.1.1

### Patch Changes

- fix rdb-command
- Updated dependencies
  - @rym-lib/utilities@1.1.1

## 1.1.0

### Minor Changes

- support postgresql for db modules

### Patch Changes

- Updated dependencies
  - @rym-lib/utilities@1.1.0

## 1.0.4

### Patch Changes

- fix support postgresql
- Updated dependencies
  - @rym-lib/utilities@1.0.4

## 1.0.3

### Patch Changes

- fix quote setting for rdb-command
- Updated dependencies
  - @rym-lib/utilities@1.0.3

## 1.0.2

### Patch Changes

- remove backquote for sqls
- Updated dependencies
  - @rym-lib/utilities@1.0.2

## 1.0.1

### Patch Changes

- afdcf5d: update query-module-driver-\*
- c34a966: update query-module-sql-builder
- Updated dependencies [afdcf5d]
- Updated dependencies [c34a966]
  - @rym-lib/utilities@1.0.1

## 1.0.1-alpha.1

### Patch Changes

- update query-module-sql-builder
- Updated dependencies
  - @rym-lib/utilities@1.0.1-alpha.1

## 1.0.1-alpha.0

### Patch Changes

- update query-module-driver-\*
- Updated dependencies
  - @rym-lib/utilities@1.0.1-alpha.0

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
- Updated dependencies [e8d2223]
- Updated dependencies [6013328]
- Updated dependencies [3332bf4]
- Updated dependencies [66c9cd9]
- Updated dependencies [96e3994]
- Updated dependencies [7ce0a23]
- Updated dependencies [fc3b944]
- Updated dependencies [c86d92c]
- Updated dependencies [ddf8d6a]
- Updated dependencies [331df3c]
- Updated dependencies [8f64765]
- Updated dependencies [5881810]
- Updated dependencies [3e1a0c5]
- Updated dependencies [90fc17b]
- Updated dependencies [51023ab]
- Updated dependencies [f9fc090]
- Updated dependencies [7c609ea]
  - @rym-lib/utilities@1.0.0

## 1.0.0-alpha.16

### Patch Changes

- update packages
- Updated dependencies
  - @rym-lib/utilities@1.0.0-alpha.16

## 1.0.0-alpha.15

### Patch Changes

- add tests
- Updated dependencies
  - @rym-lib/utilities@1.0.0-alpha.15

## 1.0.0-alpha.14

### Patch Changes

- update uri package
- Updated dependencies
  - @rym-lib/utilities@1.0.0-alpha.14

## 1.0.0-alpha.13

### Patch Changes

- support minimum feature for nakadachi-adapter-remix
- Updated dependencies
  - @rym-lib/utilities@1.0.0-alpha.13

## 1.0.0-alpha.12

### Patch Changes

- missing include index.d.mts
- Updated dependencies
  - @rym-lib/utilities@1.0.0-alpha.12

## 1.0.0-alpha.11

### Patch Changes

- fix exports settings
- Updated dependencies
  - @rym-lib/utilities@1.0.0-alpha.11

## 1.0.0-alpha.10

### Patch Changes

- update ui
- Updated dependencies
  - @rym-lib/utilities@1.0.0-alpha.10

## 1.0.0-alpha.9

### Patch Changes

- fix bug
- Updated dependencies
  - @rym-lib/utilities@1.0.0-alpha.9

## 1.0.0-alpha.8

### Patch Changes

- fix bugs
- Updated dependencies
  - @rym-lib/utilities@1.0.0-alpha.8

## 1.0.0-alpha.7

### Patch Changes

- add features for query-modules
- Updated dependencies
  - @rym-lib/utilities@1.0.0-alpha.7

## 1.0.0-alpha.6

### Patch Changes

- fix bugs
- Updated dependencies
  - @rym-lib/utilities@1.0.0-alpha.6

## 1.0.0-alpha.5

### Patch Changes

- update features
- Updated dependencies
  - @rym-lib/utilities@1.0.0-alpha.5

## 1.0.0-alpha.4

### Patch Changes

- fix bugs
- Updated dependencies
  - @rym-lib/utilities@1.0.0-alpha.4

## 1.0.0-alpha.3

### Patch Changes

- add fixes
- Updated dependencies
  - @rym-lib/utilities@1.0.0-alpha.3

## 1.0.0-alpha.2

### Patch Changes

- add features and fixes
- Updated dependencies
  - @rym-lib/utilities@1.0.0-alpha.2

## 1.0.0-alpha.1

### Patch Changes

- bump up
- Updated dependencies
  - @rym-lib/utilities@1.0.0-alpha.1

## 1.0.0-alpha.0

### Major Changes

- initial release 1.0.0

### Patch Changes

- Updated dependencies
  - @rym-lib/utilities@1.0.0-alpha.0

## 0.0.17

### Patch Changes

- bump up
- Updated dependencies
  - @rym-lib/utilities@0.0.17

## 0.0.16

### Patch Changes

- bump
- Updated dependencies
  - @rym-lib/utilities@0.0.16

## 0.0.15

### Patch Changes

- bump up
- Updated dependencies
  - @rym-lib/utilities@0.0.15

## 0.0.14

### Patch Changes

- bump up
- Updated dependencies
  - @rym-lib/utilities@0.0.14

## 0.0.13

### Patch Changes

- bump up
- Updated dependencies
  - @rym-lib/utilities@0.0.13

## 0.0.12

### Patch Changes

- bump up
- Updated dependencies
  - @rym-lib/utilities@0.0.12

## 0.0.11

### Patch Changes

- bump up
- Updated dependencies
  - @rym-lib/utilities@0.0.11

## 0.0.10

### Patch Changes

- bump up
- Updated dependencies
  - @rym-lib/utilities@0.0.10

## 0.0.9

### Patch Changes

- bump up
- Updated dependencies
  - @rym-lib/utilities@0.0.9

## 0.0.8

### Patch Changes

- fix bungs
- Updated dependencies
  - @rym-lib/utilities@0.0.8

## 0.0.7

### Patch Changes

- bump up v0.0.7
- Updated dependencies
  - @rym-lib/utilities@0.0.7

## 0.0.6

### Patch Changes

- bump up
- Updated dependencies
  - @rym-lib/utilities@0.0.6

## 0.0.1

### Patch Changes

- create remix-helper package
