---
'@rym-lib/seeder': patch
---

`placeholder` を指定しないとき、`quote` から既定を決める。`quote` が `` ` ``（未指定を含む）なら `?`、`"` か空なら `$`。これまでは常に `$` で、`quote` も `placeholder` も指定しない MySQL では `$1` が流れて失敗していた。`placeholder` を明示している場合は変わらない。既定のまま SQLite で使っている場合は `$1` から `?` に変わるが、SQLite はどちらでも同じ結果になる
