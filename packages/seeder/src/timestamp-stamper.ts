import type { SeedTarget } from './seed-target'
import type { BindValue, Value } from './seeder-types'

/**
 * created_at / updated_at オプションに従い、INSERT / UPDATE の列と値に日時を付け足す。
 */
export class TimestampStamper {
  private static readonly TIMESTAMP_COLUMNS = [
    'created_at',
    'updated_at',
  ] as const
  static readonly MAX_COLUMNS = TimestampStamper.TIMESTAMP_COLUMNS.length

  stampInsert(
    target: SeedTarget,
    records: Value[][],
  ): { columns: string[]; rows: BindValue[][] } {
    const now = new Date()
    return {
      columns: this.insertColumns(target),
      rows: records.map((record) => this.stampInsertRow(target, record, now)),
    }
  }

  insertColumns(target: SeedTarget): string[] {
    return [...target.columns, ...this.enabledColumns(target)]
  }

  stampInsertRow(target: SeedTarget, record: Value[], now: Date): BindValue[] {
    return [
      ...target.insertValuesOf(record),
      ...this.enabledColumns(target).map(() => now),
    ]
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
