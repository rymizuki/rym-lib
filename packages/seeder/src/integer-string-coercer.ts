import { isIntegerString } from './numeric-string'
import type { SeedTarget } from './seed-target'
import type { Value } from './seeder-types'
import type { TableSchema } from './table-schema'

/**
 * 整数型の列に渡された数字の文字列を bigint に置き換える。
 */
export class IntegerStringCoercer {
  includesIntegerString(records: Value[][]): boolean {
    return records.some((record) =>
      record.some((value) => isIntegerString(value)),
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
        integer_indexes.has(index) && isIntegerString(value)
          ? BigInt(value)
          : value,
      ),
    )
  }
}
