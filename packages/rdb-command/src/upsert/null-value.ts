import { raw } from './raw'
import { RawExpression } from './raw-expression'

/**
 * `NULL` リテラルを表す RawExpression のショートハンド。
 *
 * NOTE: 関数名を `null` にできないのは JS の予約語だから。トップレベル関数名は
 *       coral-sql（`coalesce` / `json_object` 等）に合わせて snake_case とし、
 *       `null_value` とする。
 * NOTE: 通常は `UpsertValue` に `null` をそのまま渡せばよい（`$n` バインドで NULL が
 *       入る）。`null_value()` が要るのは、`DO UPDATE SET col = NULL` のように **SQL
 *       リテラルの `NULL` を式として埋めたい**限定ケース（バインドを介したくない場合）。
 *
 * ```typescript
 * db.upsert('t', { category: null_value() }, ...) // VALUES (..., NULL, ...)
 * db.upsert('t', { category: null }, ...)         // VALUES (..., $n, ...) で NULL バインド
 * ```
 *
 * @returns RawExpression（`NULL`）
 */
export function null_value(): RawExpression {
  return raw('NULL')
}
