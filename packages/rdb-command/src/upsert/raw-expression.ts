import { SqlPrimitive } from './sql-primitive'

/**
 * バインド値ではなく SQL 式（関数呼び出し・型キャスト等）を表す sentinel。
 *
 * `sql` 内のバインド位置は `?` で書き、SQL 組み立て時に driver の
 * placeholder（PostgreSQL なら `$n`）へ採番し直す。`bindings` は `sql` 中の
 * `?` と同数・同順で渡す。
 *
 * NOTE: `unknown` な値と構造的に区別するため `__raw: true` を判別タグに使う。
 *       coral-sql の `unescape` はバインド値を取れないため、式＋バインドの
 *       混在（`ST_MakePoint(?, ?)` 等）を表現するにはこの独自型が必要。
 */
export interface RawExpression {
  readonly __raw: true
  readonly sql: string
  readonly bindings: SqlPrimitive[]
}
