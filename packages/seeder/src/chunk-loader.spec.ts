import { describe, expect, it } from 'vitest'

import type { BulkChunkLoader } from './bulk-chunk-loader'
import { ChunkLoader } from './chunk-loader'
import type { RowByRowChunkLoader } from './row-by-row-chunk-loader'
import { SeedTarget } from './seed-target'
import type { Value } from './seeder-types'

type Call = { target: SeedTarget; chunk: Value[][] }

describe('ChunkLoader', () => {
  const target = SeedTarget.create('users', 'id', ['id', 'name'], {})
  const chunk: Value[][] = [
    [1, 'a'],
    [2, 'b'],
  ]

  const build = (bulk_result: boolean) => {
    const bulk_calls: Call[] = []
    const row_by_row_calls: Call[] = []
    const bulk: Pick<BulkChunkLoader, 'load'> = {
      load: async (t, c) => {
        bulk_calls.push({ target: t, chunk: c })
        return bulk_result
      },
    }
    const row_by_row: Pick<RowByRowChunkLoader, 'load'> = {
      load: async (t, c) => {
        row_by_row_calls.push({ target: t, chunk: c })
      },
    }
    const loader = new ChunkLoader(
      bulk as BulkChunkLoader,
      row_by_row as RowByRowChunkLoader,
    )
    return { loader, bulk_calls, row_by_row_calls }
  }

  describe('load', () => {
    describe('一括で読み込めた場合', () => {
      it('1 行ずつの読み込みは呼ばない', async () => {
        const { loader, bulk_calls, row_by_row_calls } = build(true)
        await loader.load(target, chunk)
        expect(bulk_calls).toHaveLength(1)
        expect(row_by_row_calls).toHaveLength(0)
      })
    })

    describe('一括で読み込めなかった場合', () => {
      it('同じ target と chunk で 1 行ずつ読み込む', async () => {
        const { loader, row_by_row_calls } = build(false)
        await loader.load(target, chunk)
        expect(row_by_row_calls).toHaveLength(1)
        expect(row_by_row_calls[0]?.target).toBe(target)
        expect(row_by_row_calls[0]?.chunk).toBe(chunk)
      })
    })
  })
})
