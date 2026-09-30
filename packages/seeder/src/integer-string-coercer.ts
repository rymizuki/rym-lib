import type { SeedTarget } from './seed-target'
import type { Value } from './seeder-types'
import type { TableSchema } from './table-schema'

/**
 * 整数型の列に渡された数字の文字列を bigint に置き換える。
 */
export class IntegerStringCoercer {
  private static readonly INTEGER_STRING = /^-?\d+$/

  includesIntegerString(records: Value[][]): boolean {
    return records.some((record) =>
      record.some((value) => this.isIntegerString(value)),
    )
  }

  coerce(
    target: SeedTarget,
    records: Value[][],
    schema: TableSchema,
  ): Value[][] {
    const integer_indexes = new Set(
      target.columns.flatMap((column, index) =>
        schema.isIntegerColumn(column) ? [index] : [],
      ),
    )
    return records.map((record) =>
      record.map((value, index) =>
        integer_indexes.has(index) && this.isIntegerString(value)
          ? BigInt(value)
          : value,
      ),
    )
  }

  private isIntegerString(value: unknown): value is string {
    return (
      typeof value === 'string' &&
      IntegerStringCoercer.INTEGER_STRING.test(value)
    )
  }
}
