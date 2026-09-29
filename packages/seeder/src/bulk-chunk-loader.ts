import type { PrimaryKeyMatcher } from './primary-key-matcher'
import type { RowWriter } from './row-writer'
import type { SeedTarget } from './seed-target'
import type { SeederTableGateway } from './seeder-table-gateway'
import type { ExistingRows, Value } from './seeder-types'

/**
 * チャンクを 1 回の SELECT と 1 回の INSERT でまとめて読み込む。
 * 主キーが重複するなど一括で扱えないチャンクは何もせず false を返す。
 */
export class BulkChunkLoader {
  constructor(
    private readonly gateway: SeederTableGateway,
    private readonly matcher: PrimaryKeyMatcher,
    private readonly writer: RowWriter,
  ) {}

  async load(target: SeedTarget, chunk: Value[][]): Promise<boolean> {
    const existing_rows = await this.findRowsMatchedByPk(target, chunk)
    if (!existing_rows) return false

    await this.writer.insertMany(
      target,
      chunk.filter(
        (record) => !this.matcher.find(existing_rows, target.pkValueOf(record)),
      ),
    )
    for (const record of chunk) {
      const row = this.matcher.find(existing_rows, target.pkValueOf(record))
      if (!row) continue
      await this.writer.updateIfChanged(target, record, row)
    }
    return true
  }

  private async findRowsMatchedByPk(
    target: SeedTarget,
    chunk: Value[][],
  ): Promise<ExistingRows | null> {
    const pk_values = this.matcher.bulkQueryableValues(
      chunk.map((record) => target.pkValueOf(record)),
    )
    if (!pk_values) return null
    const rows =
      pk_values.length === 0
        ? []
        : await this.gateway.selectMany(target.table_name, target.pk, pk_values)
    return this.matcher.indexRows(target.pk, rows, pk_values)
  }
}
