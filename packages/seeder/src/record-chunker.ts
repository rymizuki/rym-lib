import type { Value } from './seeder-types'

/**
 * バインド値の上限を超えないよう、レコードを行数で分割する。
 */
export class RecordChunker {
  static readonly DEFAULT_CHUNK_SIZE = 500
  static readonly MAX_BIND_VALUES = 32767

  constructor(private readonly extra_column_count: number) {}

  split(columns: string[], records: Value[][]): Value[][][] {
    const size = Math.max(
      1,
      Math.min(
        RecordChunker.DEFAULT_CHUNK_SIZE,
        Math.floor(
          RecordChunker.MAX_BIND_VALUES /
            (columns.length + this.extra_column_count),
        ),
      ),
    )
    return Array.from(
      { length: Math.ceil(records.length / size) },
      (_, index) => records.slice(index * size, (index + 1) * size),
    )
  }
}
