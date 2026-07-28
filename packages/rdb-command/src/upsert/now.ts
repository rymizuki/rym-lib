import { raw } from './raw'
import { RawExpression } from './raw-expression'

/**
 * `now()` を表す RawExpression のショートハンド。
 *
 * ```typescript
 * db.upsert('t', { created_at: now(), updated_at: now() }, ...)
 * ```
 *
 * @returns RawExpression（`now()`）
 */
export function now(): RawExpression {
  return raw('now()')
}
