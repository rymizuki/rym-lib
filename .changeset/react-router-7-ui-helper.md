---
'@rym-lib/ui': major
'@rym-lib/remix-helper': major
---

`Link`・`useMatches`・`useLocation`・`useNavigate`・`useSearchParams`・`UIMatch` の import 元を `@remix-run/react` から `react-router` に変えた。peerDependencies も `@remix-run/react >=2.0.0` から `react-router >=7.18.0` に変わる。

Remix 2 が依存する react-router 6 系には、7.18.0 でしか直っていない脆弱性があり、Remix 2 のままでは解消できないため。

- GHSA-wrjc-x8rr-h8h6: `<Link>` と `useNavigate` に渡したバックスラッシュを含むパスによる open redirect。ui の `LinkFeature` と remix-helper の `useFlashMessage` が直接使う API
- GHSA-337j-9hxr-rhxg: SSR の hydration でのエラーのデシリアライズ

移行: アプリを React Router 7 に移行してから更新する（Remix 2 からの移行は React Router の公式ガイドを参照）。`@rym-lib/remix-helper` のパッケージ名は変わらない。

`RouteHandle<Data>` の型は次の点が変わる。

- `Data` には loader の戻り値の型を渡す（`typeof loader` ではなく `Awaited<ReturnType<typeof loader>>` や `Route.ComponentProps['loaderData']`）。Remix 2 の `SerializeFrom` による変換（`Date` が `string` になる等）は行われない
- `breadcrumbs` に渡る `match.data` は `undefined` になりうる型になった。React Router 7 では `data` は非推奨で、`loaderData` を使う
