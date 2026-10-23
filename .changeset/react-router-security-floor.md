---
'@rym-lib/nakadachi-adapter-react-router': minor
'@rym-lib/nakadachi-adapter-remix': patch
---

依存の下限を、既知の脆弱性が修正された版に上げた。

- `@rym-lib/nakadachi-adapter-react-router`: react-router を `^7.8.0` から `^7.18.2` に上げた。`7.18.2` 未満の react-router には、turbo-stream のデシリアライズによる RCE（GHSA-49rj-9fvp-4h2h）や DoS などサーバー側で効くものを含む 13 件の脆弱性があり、すべて `7.18.2` で修正されている。このアダプターを更新するときは、アプリの react-router も `7.18.2` 以上に上げる必要がある。なお、古い react-router との組み合わせを拒否するのは npm の既定の設定だけで、pnpm や yarn では警告にとどまり、npm の `--legacy-peer-deps` では警告も出ない
- `@rym-lib/nakadachi-adapter-react-router` / `@rym-lib/nakadachi-adapter-remix`: qs を `^6.13.0` から `^6.16.1` に上げた。`6.16.0` 未満の qs には DoS（GHSA-4mjr-xmp4-gh2g）、`6.14.2`〜`6.15.3` には配列上限の回避（GHSA-x5fp-wj9c-mxmx）がある。どちらもこのアダプターが使っていないオプション（`plainObjects` / `allowPrototypes` / `comma`）で発動するため、アダプター経由では起きないが、監査で検出されない版に揃える
