export type Value = string | number | bigint | Date | boolean | null
export type Row = Record<string, unknown>
export type BindValue = Value | undefined
export type Statement = { sql: string; values: BindValue[] }
export type ExistingRows = Map<string, Row>

export type SeederOptions = {
  created_at?: boolean
  updated_at?: boolean
  quote?: '`' | '"' | ''
  placeholder?: '$' | '?'
  no_update?: boolean
}

export type ColumnInfo = {
  name: string
  data_type: string
  is_nullable: boolean
}
