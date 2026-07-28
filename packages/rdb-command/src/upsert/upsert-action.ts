import { UpsertData } from './upsert-data'

/**
 * ON CONFLICT 時の動作。
 *
 * - `nothing`: `DO NOTHING`
 * - `update`: `DO UPDATE SET ...`
 *   - `set: string[]`: 各列を `"col" = excluded."col"` に自動展開（INSERT した値で洗い替え）
 *   - `set: UpsertData`: `"col" = <明示値/SQL式>` を採番して出力（インクリメント等）
 */
export type UpsertAction =
  | { type: 'nothing' }
  | { type: 'update'; set: string[] | UpsertData }
