export type Value = string | number | bigint | Date | boolean | null
export type Row = Record<string, unknown>
export type BindValue = Value | undefined
export type Statement = { sql: string; values: BindValue[] }
export type ExistingRows = Map<string, Row>
