import { describe, expect, it } from 'vitest'

import { PrimaryKeyMatcher } from './primary-key-matcher'

describe('PrimaryKeyMatcher', () => {
  const matcher = new PrimaryKeyMatcher()

  describe('toMatchKey', () => {
    it('Date は ISO 文字列にする', () => {
      expect(matcher.toMatchKey(new Date('2024-01-02T03:04:05.000Z'))).toBe(
        '2024-01-02T03:04:05.000Z',
      )
    })

    it('bigint は10進文字列にする', () => {
      expect(matcher.toMatchKey(10n)).toBe('10')
    })

    it('文字列はそのまま返す', () => {
      expect(matcher.toMatchKey('a')).toBe('a')
    })
  })

  describe('bulkQueryableValues', () => {
    it('null を除いた値を返す', () => {
      expect(matcher.bulkQueryableValues([1, null, 2])).toEqual([1, 2])
    })

    it('match key が重複していれば null を返す', () => {
      expect(matcher.bulkQueryableValues([1, 2, 1])).toBeNull()
    })

    it('型が違っても match key が同じなら重複とみなす', () => {
      expect(matcher.bulkQueryableValues([1, '1'])).toBeNull()
    })

    it('null が複数あっても重複とはみなさない', () => {
      expect(matcher.bulkQueryableValues([null, null])).toEqual([])
    })
  })

  describe('indexRows', () => {
    it('主キーの match key で行を引けるようにする', () => {
      const row = { id: 1n, name: 'a' }
      const indexed = matcher.indexRows('id', [row], [1])
      expect(indexed?.get('1')).toBe(row)
    })

    it('要求していないキーの行があれば null を返す', () => {
      expect(matcher.indexRows('id', [{ id: 2 }], [1])).toBeNull()
    })

    it('行が空なら空の Map を返す', () => {
      expect(matcher.indexRows('id', [], [1])?.size).toBe(0)
    })
  })

  describe('find', () => {
    const date = new Date('2024-01-02T03:04:05.000Z')
    const existing = new Map([
      ['1', { id: 1 }],
      [date.toISOString(), { id: date }],
    ])

    it('Date の主キーを ISO 文字列で引ける', () => {
      expect(matcher.find(existing, new Date(date.getTime()))).toEqual({
        id: date,
      })
    })

    it('bigint の主キーを数値の行と突き合わせられる', () => {
      expect(matcher.find(existing, 1n)).toEqual({ id: 1 })
    })

    it('null と undefined は undefined を返す', () => {
      expect(matcher.find(existing, null)).toBeUndefined()
      expect(matcher.find(existing, undefined)).toBeUndefined()
    })

    it('見つからなければ undefined を返す', () => {
      expect(matcher.find(existing, 99)).toBeUndefined()
    })
  })
})
