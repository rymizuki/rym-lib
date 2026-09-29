import { describe, expect, it } from 'vitest'

import { RecordChunker } from './record-chunker'
import type { Value } from './seeder-types'

describe('RecordChunker', () => {
  const columnsOf = (count: number) =>
    Array.from({ length: count }, (_, index) => `c${index}`)
  const recordsOf = (count: number): Value[][] =>
    Array.from({ length: count }, (_, index) => [index])
  const sizesOf = (chunks: Value[][][]) => chunks.map((chunk) => chunk.length)

  describe('split', () => {
    describe('列が少ない場合', () => {
      it('500 行ごとに分割する', () => {
        const chunks = new RecordChunker(2).split(columnsOf(2), recordsOf(501))
        expect(sizesOf(chunks)).toEqual([500, 1])
      })
    })

    describe('列が多く、バインド値の上限が先に来る場合', () => {
      it('100 列なら 321 行ずつに分割する', () => {
        const chunks = new RecordChunker(2).split(
          columnsOf(100),
          recordsOf(700),
        )
        expect(sizesOf(chunks)).toEqual([321, 321, 58])
      })

      it('列数が極端に多くても最低 1 行ずつ渡す', () => {
        const chunks = new RecordChunker(2).split(
          columnsOf(40000),
          recordsOf(3),
        )
        expect(sizesOf(chunks)).toEqual([1, 1, 1])
      })
    })

    describe('追加列数を指定した場合', () => {
      it('列数に加えて上限の計算に含める', () => {
        const columns = columnsOf(100)
        const records = recordsOf(700)
        expect(sizesOf(new RecordChunker(0).split(columns, records))).toEqual([
          327, 327, 46,
        ])
        expect(sizesOf(new RecordChunker(2).split(columns, records))).toEqual([
          321, 321, 58,
        ])
      })
    })

    describe('レコードが無い場合', () => {
      it('空配列を返す', () => {
        expect(new RecordChunker(2).split(columnsOf(2), [])).toEqual([])
      })
    })
  })
})
