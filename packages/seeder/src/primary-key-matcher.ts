import type { BindValue, ExistingRows, Row } from './seeder-types'

export class PrimaryKeyMatcher {
  toMatchKey(value: unknown): string {
    if (value instanceof Date) return value.toISOString()
    if (typeof value === 'string') return value
    return String(value)
  }

  bulkQueryableValues(pk_values: BindValue[]): BindValue[] | null {
    const values = pk_values.filter((pk_value) => pk_value !== null)
    const keys = new Set(values.map((value) => this.toMatchKey(value)))
    if (keys.size !== values.length) return null
    return values
  }

  indexRows(
    pk: string,
    rows: Row[],
    requested_values: BindValue[],
  ): ExistingRows | null {
    const requested_keys = new Set(
      requested_values.map((value) => this.toMatchKey(value)),
    )
    const indexed: ExistingRows = new Map(
      rows.map((row) => [this.toMatchKey(row[pk]), row]),
    )
    if ([...indexed.keys()].some((key) => !requested_keys.has(key))) return null
    return indexed
  }

  find(existing_rows: ExistingRows, pk_value: BindValue): Row | undefined {
    if (pk_value === null || pk_value === undefined) return undefined
    return existing_rows.get(this.toMatchKey(pk_value))
  }
}
