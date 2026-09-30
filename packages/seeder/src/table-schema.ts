import type { ColumnInfo } from './seeder-types'

/**
 * information_schema から読んだ列の情報。整数型かどうか、NOT NULL かどうかを答える。
 */
export class TableSchema {
  private static readonly INTEGER_TYPES = ['smallint', 'integer', 'bigint']

  private readonly columns: Map<string, ColumnInfo>

  constructor(columns: ColumnInfo[]) {
    this.columns = new Map(columns.map((column) => [column.name, column]))
  }

  isIntegerColumn(name: string): boolean {
    const column = this.columns.get(name)
    if (!column) return false
    return TableSchema.INTEGER_TYPES.includes(column.data_type)
  }

  isNotNull(name: string): boolean {
    return this.columns.get(name)?.is_nullable === false
  }
}
