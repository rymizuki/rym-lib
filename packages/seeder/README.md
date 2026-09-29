# nakadachi-interactor-mixin-validator

## load

`Seeder.load(table_name, pk, columns, records, options?)` でレコードを投入する。

- 500 行（列数が多いと縮む）ごとに、`WHERE pk IN (...)` の SELECT 1 本と複数行 INSERT 1 本にまとめ、既存行との差分がある行だけを 1 行ずつ UPDATE する
- 主キーの重複や、DB 側との突き合わせ（照合順序・末尾空白・型の違い）のずれがあるチャンクは、1 行ずつ処理する
- 正常に終わった場合の最終状態は、1 行ずつ処理した場合と同じになる。次の点は同じとは限らない
  - 失敗時に残る途中の状態
  - INSERT と UPDATE の実行順（チャンク内では INSERT が先）
  - 発行する文の本数（文単位のトリガの発火回数）
  - チャンク内の `created_at` / `updated_at` の値（同じ時刻になる）
- 一括 INSERT が失敗したら、やり直さずに元の例外をそのまま投げる。そのチャンクの UPDATE は実行しない。トランザクション内で呼んでもよい
