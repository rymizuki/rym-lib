import { RawExpression } from './raw-expression'
import { SqlPrimitive } from './sql-primitive'

/**
 * upsert の列に渡せる値。通常のバインド値、または SQL 式（RawExpression）。
 */
export type UpsertValue = SqlPrimitive | RawExpression
