import type { SeedTarget } from './seed-target'
import type { BindValue, Value } from './seeder-types'

/**
 * created_at / updated_at オプションに従い、INSERT / UPDATE の列と値に日時を付け足す。
 */
export class TimestampStamper {
  static readonly MAX_COLUMNS = 2
  private static readonly TIMESTAMP_COLUMNS = [
    'created_at',
    'updated_at',
  ] as const

  stampInsert(
    target: SeedTarget,
    records: Value[][],
  ): { columns: string[]; rows: BindValue[][] } {
    const enabled = this.enabledColumns(target)
    const now = new Date()
    return {
      columns: [...target.columns, ...enabled],
      rows: records.map((record) => [
        ...target.columns.map((_, index) => record[index]),
        ...enabled.map(() => now),
      ]),
    }
  }

  stampUpdate(
    target: SeedTarget,
    record: Value[],
  ): { columns: string[]; values: BindValue[] } {
    const columns = target.columns.filter((column) => column !== target.pk)
    const values: BindValue[] = target.columns.flatMap((_, index) =>
      index === target.pk_index ? [] : [record[index]],
    )
    if (!target.options.updated_at) return { columns, values }
    return {
      columns: [...columns, 'updated_at'],
      values: [...values, new Date()],
    }
  }

  private enabledColumns(target: SeedTarget): string[] {
    return TimestampStamper.TIMESTAMP_COLUMNS.filter(
      (column) => target.options[column],
    )
  }
}
