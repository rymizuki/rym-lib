export type Value = string | number | bigint | Date | boolean | null
export type Row = Record<string, any>
export type Statement = { sql: string; values: (Value | undefined)[] }
export type ExistingRows = Map<string, Row>
