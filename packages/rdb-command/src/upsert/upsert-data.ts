import { UpsertValue } from './upsert-value'

/**
 * upsert の INSERT する列と値のマップ。値は通常値または SQL 式。
 */
export type UpsertData = Record<string, UpsertValue>
