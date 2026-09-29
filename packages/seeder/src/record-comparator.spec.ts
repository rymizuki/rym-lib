import { describe, expect, it } from 'vitest'

import { RecordComparator } from './record-comparator'

describe('RecordComparator', () => {
  const comparator = new RecordComparator()
  const isSame = (db: unknown, seed: unknown) =>
    comparator.isSameRow({ v: db }, ['v'], [seed as never])

  describe('isSameRow', () => {
    describe('どちらかが bigint の場合', () => {
      it('数値と同じ値なら同一とみなす', () => {
        expect(isSame(5n, 5)).toBe(true)
        expect(isSame(5, 5n)).toBe(true)
      })

      it('数字文字列と同じ値なら同一とみなす', () => {
        expect(isSame(5n, '5')).toBe(true)
      })

      it('値が違えば別物とみなす', () => {
        expect(isSame(5n, 6)).toBe(false)
      })

      it('小数や数字でない文字列は別物とみなす', () => {
        expect(isSame(5n, 5.5)).toBe(false)
        expect(isSame(5n, 'abc')).toBe(false)
      })
    })

    describe('bigint が関与しない場合', () => {
      it('ゼロ埋め文字列は別物とみなす', () => {
        expect(isSame('007', '7')).toBe(false)
      })

      it('数値と数字文字列は別物とみなす', () => {
        expect(isSame(7, '7')).toBe(false)
      })

      it('Date 同士は日時が同じなら同一とみなす', () => {
        expect(
          isSame(
            new Date('2024-01-01T00:00:00Z'),
            new Date('2024-01-01T00:00:00Z'),
          ),
        ).toBe(true)
        expect(
          isSame(
            new Date('2024-01-01T00:00:00Z'),
            new Date('2024-01-02T00:00:00Z'),
          ),
        ).toBe(false)
      })

      it('null 同士は同一、null と値は別物とみなす', () => {
        expect(isSame(null, null)).toBe(true)
        expect(isSame(null, 0)).toBe(false)
      })
    })

    it('全列が等価のときだけ同一とみなす', () => {
      expect(comparator.isSameRow({ a: 1, b: 'x' }, ['a', 'b'], [1, 'x'])).toBe(
        true,
      )
      expect(comparator.isSameRow({ a: 1, b: 'x' }, ['a', 'b'], [1, 'y'])).toBe(
        false,
      )
    })
  })
})
