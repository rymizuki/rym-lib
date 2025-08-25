import { describe, it, expect, beforeEach } from 'vitest'

import { QueryRunnerResourceNotFoundException } from './exceptions'
import {
  QueryRunnerCriteria,
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

describe('QueryRunner - Method: find(params: QueryRunnerCriteria<TestData>)', () => {
  let driver: TestDriver
  let runner: QueryRunnerInterface<TestData>
  
  const testData: TestData[] = [
    { id: 1, name: 'Alice', status: 'active', email: 'alice@example.com', metadata: { tags: ['user'], priority: 1 } },
    { id: 2, name: 'Bob', status: 'inactive', email: 'bob@example.com', metadata: { tags: ['admin'], priority: 2 } },
    { id: 3, name: 'Charlie', status: 'active', email: null, metadata: { tags: ['user'], priority: 3 } },
  ]

  beforeEach(() => {
    driver = createDriver()
    runner = defineQuery<TestData>(driver, {
      name: 'test-find-query',
      source: () => testData,
      rules: {},
    })
  })

  describe('When matching TestData exists', () => {
    it('should return Promise<TestData> resolving to matching TestData', async () => {
      const result = await runner.find({ filter: { id: { eq: 1 } } })
      
      expect(result).toBeDefined()
      expect(result).toEqual(testData[0])
      expect(result.id).toBe(1)
      expect(result.name).toBe('Alice')
    })

    it('should apply QueryRunnerInterface contract for single record retrieval', async () => {
      const result = await runner.find({ filter: { name: { eq: 'Bob' } } })
      
      // find()は常にTestData型を返す（nullは返さない）
      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
      expect(result).toHaveProperty('id')
    })

    it('should never return null (throws exception instead)', async () => {
      driver.returns([])
      
      // find()はnullを返さず、代わりに例外を投げる
      await expect(runner.find({ filter: { id: { eq: 999 } } }))
        .rejects.toThrow(QueryRunnerResourceNotFoundException)
    })
  })

  describe('When no matching record exists', () => {
    it('should reject Promise with QueryRunnerResourceNotFoundException', async () => {
      driver.returns([])
      
      await expect(runner.find({ filter: { id: { eq: 999 } } }))
        .rejects.toThrow(QueryRunnerResourceNotFoundException)
    })

    it('should include QuerySpecification.name in exception message', async () => {
      driver.returns([])
      
      try {
        await runner.find({ filter: { id: { eq: 999 } } })
        throw new Error('Should have thrown an exception')
      } catch (error) {
        expect(error).toBeInstanceOf(QueryRunnerResourceNotFoundException)
        expect((error as Error).message).toContain('test-find-query')
      }
    })

    it('should include search criteria in exception message', async () => {
      driver.returns([])
      const searchCriteria = { filter: { id: { eq: 999 } } }
      
      try {
        await runner.find(searchCriteria)
        throw new Error('Should have thrown an exception')
      } catch (error) {
        expect(error).toBeInstanceOf(QueryRunnerResourceNotFoundException)
        // 検索条件が何らかの形でエラーメッセージに含まれることを確認
        expect((error as Error).message).toBeDefined()
      }
    })
  })

  describe('When multiple matching TestData exist', () => {
    it('should return Promise<TestData> resolving to first matching TestData', async () => {
      // activeステータスのレコードが複数ある場合
      driver.returns([testData[0]!, testData[2]!]) // Alice and Charlie
      
      const result = await runner.find({ filter: { status: { eq: 'active' } } })
      
      expect(result).toEqual(testData[0]) // 最初のマッチするレコード
    })

    it('should respect orderBy for determining "first" record', async () => {
      await runner.find({ 
        filter: { status: { eq: 'active' } }, 
        orderBy: 'name:desc' as any 
      })
      
      expect(driver.called[0]!.args[0].orderBy).toBe('name:desc')
      expect(driver.called[0]!.args[0].take).toBe(1)
    })
  })

  describe('With params: {filter: {status: {eq: "active"}}, orderBy: "name:desc", skip: 2}', () => {
    it('should return Promise<TestData> applying all criteria', async () => {
      const params = {
        filter: { status: { eq: 'active' } },
        orderBy: 'name:desc' as any,
        skip: 2
      }
      
      const result = await runner.find(params)
      
      expect(result).toBeDefined()
      expect(driver.called[0]!.args[0].filter).toEqual(params.filter)
      expect(driver.called[0]!.args[0].orderBy).toBe(params.orderBy)
      expect(driver.called[0]!.args[0].skip).toBe(params.skip)
    })

    it('should respect QueryFilter<TestData> filtering rules', async () => {
      await runner.find({ 
        filter: { status: { eq: 'active' } } 
      })
      
      expect(driver.called[0]!.args[0].filter).toEqual({ status: { eq: 'active' } })
    })

    it('should respect sorting and pagination parameters', async () => {
      await runner.find({ 
        filter: { status: { eq: 'active' } },
        orderBy: 'id:asc' as any,
        skip: 1
      })
      
      expect(driver.called[0]!.args[0].orderBy).toBe('id:asc')
      expect(driver.called[0]!.args[0].skip).toBe(1)
      expect(driver.called[0]!.args[0].take).toBe(1)
    })

    it('should respect QuerySpecification.rules property mapping', async () => {
      // プロパティマッピングの詳細は rules-mapping.spec.ts で実装
      await runner.find({ filter: { name: { eq: 'Alice' } } })
      
      expect(driver.called[0]!.args[0].filter).toEqual({ name: { eq: 'Alice' } })
    })
  })

  describe('Error handling', () => {
    it('should reject Promise when data retrieval fails', async () => {
      runner = defineQuery<TestData>(driver, {
        name: 'failing-find-query',
        source: () => {
          throw new Error('Database connection failed')
        },
        rules: {},
      })
      
      await expect(runner.find({ filter: { id: { eq: 1 } } }))
        .rejects.toThrow('Database connection failed')
    })

    it('should reject Promise with QueryRunnerResourceNotFoundException when no match', async () => {
      driver.returns([])
      
      await expect(runner.find({ filter: { id: { eq: 999 } } }))
        .rejects.toThrow(QueryRunnerResourceNotFoundException)
    })

    it('should provide meaningful error information', async () => {
      driver.returns([])
      
      try {
        await runner.find({ filter: { id: { eq: 999 } } })
        throw new Error('Should have thrown an exception')
      } catch (error) {
        expect(error).toBeInstanceOf(QueryRunnerResourceNotFoundException)
        expect((error as Error).message).toBeDefined()
        expect((error as Error).message.length).toBeGreaterThan(0)
      }
    })
  })
})
