import { RawExpression } from './raw-expression'

/**
 * 値が RawExpression（SQL 式 sentinel）かどうかを判定する型ガード。
 *
 * @param value 判定対象
 * @returns RawExpression なら true
 */
export function isRawExpression(value: unknown): value is RawExpression {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { __raw?: unknown }).__raw === true
  )
}
