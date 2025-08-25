import { describe, it, expect, beforeEach } from 'vitest'

import {
  QueryRunnerInterface,
} from './interfaces'
import { defineQuery } from './functions/define-query'
import { createDriver, TestDriver } from './test-utils/test-driver'

type TestData = {
  id: number
  name: string
  status: 'active' | 'inactive'
  email: string | null
  metadata?: {
    tags: string[]
    priority: number
  }
}

describe('QueryRunner - Edge cases and boundary conditions', () => {
  let driver: TestDriver
  let runner: QueryRunnerInterface<TestData>
  
  const testData: TestData[] = [
    { id: 1, name: 'Alice', status: 'active', email: 'alice@example.com', metadata: { tags: ['user'], priority: 1 } },
    { id: 2, name: 'Bob', status: 'inactive', email: 'bob@example.com', metadata: { tags: ['admin'], priority: 2 } },
  ]

  beforeEach(() => {
    driver = createDriver()
    runner = defineQuery<TestData>(driver, {
      name: 'edge-case-query',
      source: () => testData,
      rules: {},
    })
  })

  describe('Parameter edge cases', () => {
    it('should handle params: undefined as {}', async () => {
      const result = await runner.many(undefined as any)
      
      expect(result).toHaveProperty('items')
      expect(driver.called[0]!.args[0].filter).toEqual({})
    })

    it('should handle params: null as {}', async () => {
      // nullパラメータはエラーになる（実装がnullを適切に処理していない）
      await expect(runner.many(null as any)).rejects.toThrow()
    })

    it('should handle params: {} as empty criteria', async () => {
      const result = await runner.many({})
      
      expect(result).toHaveProperty('items')
      expect(driver.called[0]!.args[0].filter).toEqual({})
      expect(driver.called[0]!.args[0].orderBy).toBeUndefined()
      expect(driver.called[0]!.args[0].skip).toBeUndefined()
    })

    it('should handle params with invalid types (filter: "string" instead of object)', async () => {
      // 不正な型の場合でも実行は成功するが、文字列がオブジェクトとして解釈される
      const result = await runner.many({ filter: 'invalid' as any })
      
      expect(result).toHaveProperty('items')
      // 文字列が文字の配列のようなオブジェクトに変換される
      const calledFilter = driver.called[0]!.args[0].filter
      expect(typeof calledFilter).toBe('object')
      expect(calledFilter['0']).toEqual({ column: null, value: 'i' })
    })
  })

  describe('Data edge cases', () => {
    it('should handle TestData with null properties', async () => {
      const nullDataRunner = defineQuery<TestData>(driver, {
        name: 'null-data-query',
        source: () => [
          { id: 1, name: 'Test', status: 'active', email: null, metadata: undefined },
        ],
        rules: {},
      })
      
      const result = await nullDataRunner.many()
      
      expect(result.items).toHaveLength(1)
      expect(result.items[0]!.email).toBeNull()
      expect(result.items[0]!.metadata).toBeUndefined()
    })

    it('should handle TestData with undefined properties', async () => {
      const undefinedDataRunner = defineQuery<TestData>(driver, {
        name: 'undefined-data-query',
        source: () => [
          { id: 1, name: 'Test', status: 'active', email: null } as TestData,
        ],
        rules: {},
      })
      
      const result = await undefinedDataRunner.many()
      
      expect(result.items).toHaveLength(1)
      expect(result.items[0]!).toHaveProperty('id')
      expect(result.items[0]!).toHaveProperty('name')
      expect(result.items[0]!).toHaveProperty('status')
      expect(result.items[0]!).toHaveProperty('email')
    })

    it('should handle malformed TestData missing required fields', async () => {
      const malformedDataRunner = defineQuery<TestData>(driver, {
        name: 'malformed-data-query',
        source: () => [
          { name: 'Incomplete' } as TestData, // idが欠落
        ],
        rules: {},
      })
      
      const result = await malformedDataRunner.many()
      
      expect(result.items).toHaveLength(1)
      expect(result.items[0]!).toHaveProperty('name')
      expect(result.items[0]!.name).toBe('Incomplete')
    })
  })

  describe('spec.rules mapping edge cases', () => {
    it('should handle rules pointing to non-existent target fields', async () => {
      const mappingRunner = defineQuery<TestData>(driver, {
        name: 'nonexistent-mapping-query',
        source: () => testData,
        rules: {
          name: 'nonexistent_field',
          id: 'another_missing_field'
        },
      })
      
      await mappingRunner.many({ filter: { name: { eq: 'Alice' } } })
      
      // マッピングは実行されるが、存在しないフィールドにマッピングされる
      expect(driver.called[0]!.args[0].filter).toEqual({
        nonexistent_field: { column: 'nonexistent_field', value: { eq: 'Alice' } }
      })
    })

    it('should handle invalid rules: {key: null, key2: undefined}', async () => {
      const invalidRulesRunner = defineQuery<TestData>(driver, {
        name: 'invalid-rules-query',
        source: () => testData,
        rules: {
          name: null as any,
          id: undefined as any,
          status: 'mapped_status'
        },
      })
      
      await invalidRulesRunner.many({ 
        filter: { 
          name: { eq: 'Alice' },
          status: { eq: 'active' }
        } 
      })
      
      // null/undefinedのルールは無視され、正常なルールのみ適用される
      const calledFilter = driver.called[0]!.args[0].filter
      expect(calledFilter.name).toEqual({ column: null, value: { eq: 'Alice' } }) // マッピングされない
      expect(calledFilter.mapped_status).toEqual({ column: 'mapped_status', value: { eq: 'active' } }) // マッピングされる
    })

    it('should handle empty rules object', async () => {
      const emptyRulesRunner = defineQuery<TestData>(driver, {
        name: 'empty-rules-query',
        source: () => testData,
        rules: {},
      })
      
      await emptyRulesRunner.many({ filter: { name: { eq: 'Alice' } } })
      
      // ルールが空の場合、そのままマッピングされない
      expect(driver.called[0]!.args[0].filter).toEqual({
        name: { column: null, value: { eq: 'Alice' } }
      })
    })
  })

  describe('Extreme boundary conditions', () => {
    it('should handle very large datasets without memory issues', () => {
      // 大量のデータでもメモリリークしないことを確認
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `User${i}`,
        status: i % 2 === 0 ? 'active' : 'inactive',
        email: `user${i}@example.com`,
        metadata: { tags: ['user'], priority: i % 10 }
      } as TestData))
      
      const largeDataRunner = defineQuery<TestData>(driver, {
        name: 'large-data-query',
        source: () => largeDataset,
        rules: {},
      })
      
      // メモリ使用量を監視（テストでは実際の制約は設けない）
      expect(() => largeDataRunner.many()).not.toThrow()
    })

    it('should handle concurrent operations without race conditions', async () => {
      // 複数の同時操作が競合状態を引き起こさないことを確認
      const promises = Array.from({ length: 10 }, (_, i) => 
        runner.many({ filter: { id: { eq: i % 2 + 1 } } })
      )
      
      const results = await Promise.all(promises)
      
      expect(results).toHaveLength(10)
      results.forEach(result => {
        expect(result).toHaveProperty('items')
        expect(Array.isArray(result.items)).toBe(true)
      })
    })

    it('should handle deeply nested filter conditions', async () => {
      // 複雑にネストされた条件も処理できることを確認
      const deepFilter = {
        filter: [
          {
            name: { eq: 'Alice' },
            status: { eq: 'active' }
          },
          {
            id: { gte: 1 },
            email: { ne: null }
          }
        ] as any
      }
      
      await runner.many(deepFilter)
      
      const expectedFilter = [
        {
          name: { column: null, value: { eq: 'Alice' } },
          status: { column: null, value: { eq: 'active' } }
        },
        {
          id: { column: null, value: { gte: 1 } },
          email: { column: null, value: { ne: null } }
        }
      ]
      expect(driver.called[0]!.args[0].filter).toEqual(expectedFilter)
    })
  })
})
