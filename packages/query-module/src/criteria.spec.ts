import { beforeEach, describe, expect, it } from 'vitest'

import { QueryCriteria } from './criteria'

describe('QueryCriteria', () => {
  describe('null/undefined value handling', () => {
    describe('when filter contains null values', () => {
      it('should filter out null values and not cause sql-builder errors', () => {
        const criteria = new QueryCriteria(
          { name: 'name', value: 'value' },
          {
            filter: {
              name: null, // この null がフィルタリングされるべき
              value: { eq: 'test' }, // この値は残るべき
            },
          },
        )

        const result = criteria.filter as any

        // null値のフィールドは除外され、有効な値のみが残る
        expect(result).toEqual({
          value: {
            column: 'value',
            value: { eq: 'test' },
            filter: undefined,
          },
        })

        // name フィールドは null だったため除外される
        expect(result).not.toHaveProperty('name')
      })
    })

    describe('when filter contains undefined values', () => {
      it('should filter out undefined values', () => {
        const criteria = new QueryCriteria(
          { name: 'name', value: 'value' },
          {
            filter: {
              name: undefined, // この undefined がフィルタリングされるべき
              value: { eq: 'test' }, // この値は残るべき
            },
          },
        )

        const result = criteria.filter as any

        // undefined値のフィールドは除外され、有効な値のみが残る
        expect(result).toEqual({
          value: {
            column: 'value',
            value: { eq: 'test' },
            filter: undefined,
          },
        })

        // name フィールドは undefined だったため除外される
        expect(result).not.toHaveProperty('name')
      })
    })

    describe('when filter array contains null/undefined elements', () => {
      it('should filter out fields with null/undefined values from each filter', () => {
        const criteria = new QueryCriteria(
          { name: 'name', value: 'value', age: 'age' },
          {
            filter: [
              {
                name: { eq: 'valid' },
                value: null, // これは除外される
              },
              {
                name: undefined, // これは除外される
                age: { gt: 18 }, // これは残る
              },
            ],
          },
        )

        const result = criteria.filter as any[]

        expect(result).toHaveLength(2)

        // 最初のフィルタ: name のみ残る (value は null で除外)
        expect(result[0]).toEqual({
          name: {
            column: 'name',
            value: { eq: 'valid' },
            filter: undefined,
          },
        })
        expect(result[0]).not.toHaveProperty('value')

        // 2番目のフィルタ: age のみ残る (name は undefined で除外)
        expect(result[1]).toEqual({
          age: {
            column: 'age',
            value: { gt: 18 },
            filter: undefined,
          },
        })
        expect(result[1]).not.toHaveProperty('name')
      })
    })

    describe('when all filter values are null/undefined', () => {
      it('should return empty filter object for single filter', () => {
        const criteria = new QueryCriteria(
          { name: 'name', value: 'value' },
          {
            filter: {
              name: null,
              value: undefined,
            },
          },
        )

        const result = criteria.filter

        // 全ての値が null/undefined の場合、空のオブジェクトが返される
        expect(result).toEqual({})
      })

      it('should exclude empty filter objects from array', () => {
        const criteria = new QueryCriteria(
          { name: 'name', value: 'value' },
          {
            filter: [
              {
                name: { eq: 'valid' }, // これは残る
              },
              {
                name: null, // このフィルタ全体が空になる
                value: undefined,
              },
            ],
          },
        )

        const result = criteria.filter as any[]

        expect(result).toHaveLength(1)
        expect(result[0]).toEqual({
          name: {
            column: 'name',
            value: { eq: 'valid' },
            filter: undefined,
          },
        })
      })
    })

    describe('edge cases', () => {
      it('should handle empty object values correctly', () => {
        const criteria = new QueryCriteria(
          { name: 'name' },
          {
            filter: {
              name: {}, // 空のオブジェクトは有効な値として扱われる
            },
          },
        )

        const result = criteria.filter as any

        expect(result).toEqual({
          name: {
            column: 'name',
            value: {},
            filter: undefined,
          },
        })
      })

      it('should handle false/0 values correctly (should not filter out)', () => {
        const criteria = new QueryCriteria(
          { active: 'active', count: 'count' },
          {
            filter: {
              active: false, // false は有効な値
              count: 0, // 0 は有効な値
            },
          },
        )

        const result = criteria.filter as any

        expect(result).toEqual({
          active: {
            column: 'active',
            value: false,
            filter: undefined,
          },
          count: {
            column: 'count',
            value: 0,
            filter: undefined,
          },
        })
      })
    })

    describe('regression test: sql-builder compatibility', () => {
      it('should not create filter structures that cause sql-builder errors', () => {
        // この修正前は、この構造が sql-builder でエラーを引き起こしていた
        const criteria = new QueryCriteria(
          { name: 'name', value: 'value' },
          {
            filter: {
              name: null, // 修正前: これが { value: null } 構造を作って sql-builder エラー
              value: { eq: 'test' },
            },
          },
        )

        const result = criteria.filter as any

        // null 値は完全に除外され、sql-builder に渡されない
        expect(result).toEqual({
          value: {
            column: 'value',
            value: { eq: 'test' },
            filter: undefined,
          },
        })

        // name は null だったため存在しない
        expect(result).not.toHaveProperty('name')

        // この結果が sql-builder に渡されても、null 値が原因でエラーは発生しない
        // なぜなら、null 値を含む構造体自体が作られないから
      })
    })
  })
})
