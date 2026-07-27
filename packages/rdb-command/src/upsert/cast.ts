import { raw } from './raw'
import { RawExpression } from './raw-expression'
import { SqlPrimitive } from './sql-primitive'

/**
 * `value::type` の型キャストを表す RawExpression のショートハンド。
 *
 * ```typescript
 * cast(clientTripId, 'uuid')          // ?::uuid
 * cast(monthStart, 'date')            // ?::date
 * cast(JSON.stringify(map), 'jsonb')  // ?::jsonb
 * ```
 *
 * NOTE: `type` は識別子としてそのまま埋め込む（バインドしない）。呼び出し側が
 *       信頼できる型名リテラルを渡す前提。ユーザー入力を渡さないこと。
 *
 * @param value キャスト対象のバインド値
 * @param type PostgreSQL の型名（`uuid` / `date` / `jsonb` 等）
 * @returns RawExpression（`?::type`）
 */
export function cast(value: SqlPrimitive, type: string): RawExpression {
  return raw(`?::${type}`, value)
}
