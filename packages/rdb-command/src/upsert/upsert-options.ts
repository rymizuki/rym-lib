import { DataBaseCommandOptionsPartial } from '../interfaces'

/**
 * upsert のオプション。
 *
 * - `returning`: `RETURNING` 句。列名の配列、または `'*'`。指定すると内部で
 *   `query`（`$queryRawUnsafe`）を使い、結果行を `UpsertResult.rows` に格納する。
 *   未指定なら `execute`（`$executeRawUnsafe`）を使い `rows` は空配列。
 *   NOTE: 列名は識別子として直接埋め込まれる（バインドされない）。信頼できる
 *         リテラルのみを渡すこと（ユーザー入力を渡さない）。
 */
export interface UpsertOptions extends DataBaseCommandOptionsPartial {
  returning?: string[] | '*'
}
