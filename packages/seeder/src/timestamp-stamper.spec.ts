import { describe, expect, it } from 'vitest'

import { SeedTarget } from './seed-target'
import type { SeederOptions } from './seeder-types'
import { TimestampStamper } from './timestamp-stamper'

describe('TimestampStamper', () => {
  const stamper = new TimestampStamper()
  const targetOf = (options: SeederOptions) =>
    SeedTarget.create('users', 'id', ['id', 'name'], options)

  describe('stampInsert', () => {
    describe('日時列が無効の場合', () => {
      it('列も値も足さない', () => {
        const { columns, rows } = stamper.stampInsert(targetOf({}), [[1, 'a']])
        expect(columns).toEqual(['id', 'name'])
        expect(rows).toEqual([[1, 'a']])
      })
    })

    describe('created_at のみ有効の場合', () => {
      it('created_at を列と値の末尾に足す', () => {
        const { columns, rows } = stamper.stampInsert(
          targetOf({ created_at: true }),
          [[1, 'a']],
        )
        expect(columns).toEqual(['id', 'name', 'created_at'])
        expect(rows[0]).toHaveLength(3)
        expect(rows[0]?.[2]).toBeInstanceOf(Date)
      })
    })

    describe('両方有効の場合', () => {
      const { columns, rows } = stamper.stampInsert(
        targetOf({ created_at: true, updated_at: true }),
        [
          [1, 'a'],
          [2, 'b'],
        ],
      )

      it('created_at と updated_at をこの順で足す', () => {
        expect(columns).toEqual(['id', 'name', 'created_at', 'updated_at'])
      })

      it('全行・全日時列で同じ Date インスタンスを使う', () => {
        const dates = rows.flatMap((row) => row.slice(2))
        expect(dates).toHaveLength(4)
        expect(new Set(dates).size).toBe(1)
      })
    })

    describe('record の長さが列数と違う場合', () => {
      it('長ければ切り詰め、短ければ undefined で埋める', () => {
        const { rows } = stamper.stampInsert(targetOf({}), [
          [1, 'a', 'extra'],
          [2],
        ])
        expect(rows).toEqual([
          [1, 'a'],
          [2, undefined],
        ])
      })
    })
  })

  describe('stampUpdate', () => {
    describe('updated_at が無効の場合', () => {
      it('pk を除いた列と値を返す', () => {
        const { columns, values } = stamper.stampUpdate(targetOf({}), [1, 'a'])
        expect(columns).toEqual(['name'])
        expect(values).toEqual(['a'])
      })

      it('created_at だけ有効でも updated_at は足さない', () => {
        const { columns } = stamper.stampUpdate(
          targetOf({ created_at: true }),
          [1, 'a'],
        )
        expect(columns).toEqual(['name'])
      })
    })

    describe('updated_at が有効の場合', () => {
      it('updated_at と現在日時を末尾に足す', () => {
        const { columns, values } = stamper.stampUpdate(
          targetOf({ updated_at: true }),
          [1, 'a'],
        )
        expect(columns).toEqual(['name', 'updated_at'])
        expect(values[0]).toBe('a')
        expect(values[1]).toBeInstanceOf(Date)
      })
    })
  })
})
