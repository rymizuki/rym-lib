import type { BulkChunkLoader } from './bulk-chunk-loader'
import type { RowByRowChunkLoader } from './row-by-row-chunk-loader'
import type { SeedTarget } from './seed-target'
import type { Value } from './seeder-types'

/**
 * チャンクを一括で読み込み、一括で扱えなければ 1 行ずつの読み込みに切り替える。
 */
export class ChunkLoader {
  constructor(
    private readonly bulk: BulkChunkLoader,
    private readonly row_by_row: RowByRowChunkLoader,
  ) {}

  async load(target: SeedTarget, chunk: Value[][]): Promise<void> {
    if (await this.bulk.load(target, chunk)) return
    await this.row_by_row.load(target, chunk)
  }
}
