import type { RowWriter } from './row-writer'
import type { SeedTarget } from './seed-target'
import type { SeederTableGateway } from './seeder-table-gateway'
import type { Value } from './seeder-types'

/**
 * チャンクを 1 行ずつ SELECT し、無ければ INSERT、あれば UPDATE する。
 */
export class RowByRowChunkLoader {
  constructor(
    private readonly gateway: SeederTableGateway,
    private readonly writer: RowWriter,
  ) {}

  async load(target: SeedTarget, chunk: Value[][]): Promise<void> {
    for (const record of chunk) {
      const row = await this.gateway.selectOne(
        target.table_name,
        target.pk,
        target.pkValueOf(record),
      )
      if (!row) {
        await this.writer.insertOne(target, record)
        continue
      }
      await this.writer.updateIfChanged(target, record, row)
    }
  }
}
