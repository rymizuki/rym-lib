---
'@rym-lib/ui': major
'@rym-lib/remix-helper': major
---

`Link`・`useMatches`・`useLocation`・`useNavigate`・`useSearchParams`・`UIMatch` の import 元を `@remix-run/react` から `react-router` に変えた。peerDependencies も `@remix-run/react >=2.0.0` から `react-router >=7.18.0` に変わる。

Remix 2 が依存する react-router 6 系には、7.18.0 でしか直っていない脆弱性（GHSA の 2 件）があり、Remix 2 のままでは解消できないため。

移行: アプリを React Router 7 に移行してから更新する（Remix 2 からの移行は React Router の公式ガイドを参照）。`@rym-lib/remix-helper` のパッケージ名は変わらない。
