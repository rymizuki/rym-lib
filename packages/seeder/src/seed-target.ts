import type { SeederOptions, Value } from './seeder-types'
import type { TableSchema } from './table-schema'

/**
 * 読み込み対象のテーブルと、その呼び出しで有効なオプションをまとめた値オブジェクト。
 */
export class SeedTarget {
  static create(
    table_name: string,
    pk: string,
    columns: string[],
    options: SeederOptions,
  ): SeedTarget {
    const pk_index = columns.findIndex((column) => column === pk)
    if (pk_index < 0)
      throw new Error(
        `Seeder error: table(${table_name}) pk(${pk}) missing in (${columns.join(
          ', ',
        )})`,
      )
    return new SeedTarget(table_name, pk, pk_index, columns, options)
  }

  private constructor(
    readonly table_name: string,
    readonly pk: string,
    readonly pk_index: number,
    readonly columns: string[],
    readonly options: SeederOptions,
    readonly schema: TableSchema | null = null,
    private readonly source_indexes: number[] = columns.map(
      (_, index) => index,
    ),
  ) {}

  withSchema(schema: TableSchema | null): SeedTarget {
    return new SeedTarget(
      this.table_name,
      this.pk,
      this.pk_index,
      this.columns,
      this.options,
      schema,
      this.source_indexes,
    )
  }

  /**
   * 主キー列を INSERT の列から外した派生。INSERT 専用で、pkValueOf は使わない。
   */
  withoutPrimaryKeyColumn(): SeedTarget {
    const kept = this.columns.flatMap((column, index) =>
      index === this.pk_index ? [] : [{ column, source_index: index }],
    )
    return new SeedTarget(
      this.table_name,
      this.pk,
      -1,
      kept.map((entry) => entry.column),
      this.options,
      this.schema,
      kept.map((entry) => entry.source_index),
    )
  }

  omitsPrimaryKeyOf(record: Value[]): boolean {
    const pk_value = this.pkValueOf(record)
    if (pk_value !== null && pk_value !== undefined) return false
    return this.schema?.isNotNull(this.pk) === true
  }

  insertValuesOf(record: Value[]): (Value | undefined)[] {
    return this.source_indexes.map((index) => record[index])
  }

  pkValueOf(record: Value[]): Value | undefined {
    return record[this.pk_index]
  }
}
