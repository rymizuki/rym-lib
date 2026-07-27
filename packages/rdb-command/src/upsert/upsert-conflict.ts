import { RawExpression } from './raw-expression'
import { UpsertAction } from './upsert-action'

/**
 * ON CONFLICT の指定。
 *
 * - `target`: 競合を判定する列（複合可）。unique / PK 制約に対応している必要がある。
 * - `targetWhere`: 部分 unique index に対する index predicate
 *   （例: `raw("name_source = 'home'")` → `ON CONFLICT (...) WHERE name_source = 'home'`）。
 * - `action`: 競合時の動作（DO NOTHING / DO UPDATE）。
 */
export interface UpsertConflict {
  target: string[]
  targetWhere?: RawExpression
  action: UpsertAction
}
