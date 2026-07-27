import { RawExpression } from './raw-expression'
import { SqlPrimitive } from './sql-primitive'

/**
 * SQL 式（関数呼び出し・型キャスト等）を表す RawExpression を作る。
 *
 * バインド位置は `?` で書く。`bindings` は `sql` 中の `?` と同数・同順で渡す。
 *
 * ```typescript
 * raw('?::uuid', clientTripId)
 * raw('ST_SetSRID(ST_MakePoint(?, ?), 4326)', lng, lat)
 * raw('now()') // バインドなし
 * ```
 *
 * NOTE: `sql` 内の `?` は**すべてバインド位置として扱われる**。SQL 組み立て時に
 *       各 `?` を出現順に placeholder（`$n`）へ置換するため、以下は書けない:
 *       - 文字列リテラル内の `?`（例: `"status = '?x'"`）
 *       - jsonb / geometry の `?` 演算子（`?` / `?|` / `?&`）
 *       これらを含めると `?` の個数が bindings 数と食い違い、例外になる（`renderRawSql`）。
 *       演算子が必要な場合は式を分割するか、別の同等表現を使うこと。
 * NOTE: `sql` は識別子・演算子ともにエスケープせず**無加工で埋め込む**。信頼できる
 *       リテラルのみを渡し、ユーザー入力を `sql` に連結しないこと（インジェクション防止）。
 *
 * @param sql `?` をバインド位置に含む SQL 式（信頼できるリテラルのみ）
 * @param bindings `?` に対応するバインド値（順序どおり）
 * @returns RawExpression
 */
export function raw(sql: string, ...bindings: SqlPrimitive[]): RawExpression {
  return { __raw: true, sql, bindings }
}
