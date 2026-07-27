/**
 * upsert の結果。
 *
 * - `rows`: `RETURNING` 指定時のみ非空。`ON CONFLICT DO NOTHING` で衝突した行は
 *   PostgreSQL の仕様上返らないため、`rows.length > 0` は「自分が INSERT した」を意味する
 *   （get-or-create の created 判定に使える）。
 */
export interface UpsertResult<Row> {
  rows: Row[]
}
