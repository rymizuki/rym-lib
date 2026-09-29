import type { SeederOptions, Value } from './seeder-types'

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
  ) {}

  pkValueOf(record: Value[]): Value | undefined {
    return record[this.pk_index]
  }
}
