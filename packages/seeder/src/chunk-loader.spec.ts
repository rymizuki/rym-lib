import { describe, expect, it, vi } from 'vitest'

import type { BulkChunkLoader } from './bulk-chunk-loader'
import { ChunkLoader } from './chunk-loader'
import type { RowByRowChunkLoader } from './row-by-row-chunk-loader'
import { SeedTarget } from './seed-target'
import type { Value } from './seeder-types'

describe('ChunkLoader', () => {
  const target = SeedTarget.create('users', 'id', ['id', 'name'], {})
  const chunk: Value[][] = [
    [1, 'a'],
    [2, 'b'],
  ]

  const build = (bulk_result: boolean) => {
    const bulk = { load: vi.fn().mockResolvedValue(bulk_result) }
    const row_by_row = { load: vi.fn().mockResolvedValue(undefined) }
    const loader = new ChunkLoader(
      bulk as unknown as BulkChunkLoader,
      row_by_row as unknown as RowByRowChunkLoader,
    )
    return { loader, bulk, row_by_row }
  }

  describe('load', () => {
    describe('一括で読み込めた場合', () => {
      it('同じ target と chunk で一括読み込みを呼び、1 行ずつの読み込みは呼ばない', async () => {
        const { loader, bulk, row_by_row } = build(true)
        await loader.load(target, chunk)
        expect(bulk.load).toHaveBeenCalledWith(target, chunk)
        expect(row_by_row.load).not.toHaveBeenCalled()
      })
    })

    describe('一括で読み込めなかった場合', () => {
      it('同じ target と chunk で 1 行ずつ読み込む', async () => {
        const { loader, row_by_row } = build(false)
        await loader.load(target, chunk)
        expect(row_by_row.load).toHaveBeenCalledWith(target, chunk)
      })
    })
  })
})
