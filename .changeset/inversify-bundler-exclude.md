---
'@rym-lib/inversify-bundler': minor
---

`Bundler` に `exclude(...modules)` を足した。渡した Module から解決した名前の Module を除いた、新しい `Bundler` を返す。

親コンテナが読み込んだ Module を子コンテナにもう一度読み込むと、親の singleton とは別のインスタンスが子で作られる。`new Bundler(...depends).exclude(RootModule).resolve()` で親にある Module を除いてから子に読み込めば、親の singleton を共有できる。
