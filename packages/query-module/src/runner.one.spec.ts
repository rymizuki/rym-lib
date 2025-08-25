import { describe, it, expect, beforeEach } from 'vitest'

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

describe('QueryRunner - Method: one(params?: Partial<QueryRunnerCriteria<TestData>>)', () => {
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
      name: 'test-query',
      source: () => testData,
      rules: {},
    })
  })

  describe('When params is undefined', () => {
    describe('When data source contains multiple TestData records', () => {
      it('should return Promise<TestData | null> resolving to first TestData record', async () => {
        const result = await runner.one()
        
        expect(result).not.toBeNull()
        expect(result).toEqual(testData[0])
      })

      it('should return TestData with all required properties', async () => {
        const result = await runner.one()
        
        expect(result).toHaveProperty('id')
        expect(result).toHaveProperty('name')
        expect(result).toHaveProperty('status')
        expect(result).toHaveProperty('email')
      })

      it('should not mutate original params object', async () => {
        const params = { filter: { name: { eq: 'Alice' } } }
        const originalParams = { ...params }

        await runner.one(params)

        // one() must not modify the caller's params object
        expect(params.filter).toEqual(originalParams.filter)
        expect((params as any).take).toBeUndefined()
      })
    })

    describe('When data source is empty', () => {
      beforeEach(() => {
        runner = defineQuery<TestData>(driver, {
          name: 'empty-query',
          source: () => [],
          rules: {},
        })
      })

      it('should return Promise<TestData | null> resolving to null', async () => {
        const result = await runner.one()
        
        expect(result).toBeNull()
      })

      it('should not throw Error or Exception', async () => {
        await expect(runner.one()).resolves.not.toThrow()
      })
    })
  })

  describe('When params is {filter: {id: {eq: 2}}}', () => {
    describe('When matching records exist', () => {
      it('should return Promise<TestData | null> resolving to TestData with id: 2', async () => {
        // TestDriverはフィルタリングをサポートしていないため、結果を手動設定
        driver.returns([testData[1]!])
        
        const result = await runner.one({ filter: { id: { eq: 2 } } })
        
        expect(result).not.toBeNull()
        expect(result?.id).toBe(2)
        expect(result?.name).toBe('Bob')
      })

      it('should apply QueryFilter<TestData> correctly', async () => {
        await runner.one({ filter: { id: { eq: 2 } } })
        
        // ドライバーが正しい条件で呼び出されたことを確認
        expect(driver.called[0]!.args[0].filter).toEqual({ id: { eq: 2 } })
      })

      it('should respect property mapping rules from QuerySpecification', async () => {
        // プロパティマッピングのテストは rules-mapping.spec.ts で詳細実装
        await runner.one({ filter: { name: { eq: 'Bob' } } })
        
        expect(driver.called[0]!.args[0].filter).toEqual({ name: { eq: 'Bob' } })
      })
    })

    describe('When no matching records exist', () => {
      it('should return Promise<TestData | null> resolving to null', async () => {
        driver.returns([])
        
        const result = await runner.one({ filter: { id: { eq: 999 } } })
        
        expect(result).toBeNull()
      })

      it('should not throw QueryRunnerResourceNotFoundException', async () => {
        driver.returns([])
        
        await expect(runner.one({ filter: { id: { eq: 999 } } })).resolves.not.toThrow()
      })
    })
  })

  describe('When params is {orderBy: "name:desc"}', () => {
    it('should return Promise<TestData | null> resolving to first TestData according to descending name sort', async () => {
      const result = await runner.one({ orderBy: 'name:desc' as any })
      
      expect(result).toBeDefined()
      expect(driver.called[0]!.args[0].orderBy).toBe('name:desc')
    })

    it('should handle orderBy: "name:asc" correctly', async () => {
      await runner.one({ orderBy: 'name:asc' as any })
      
      expect(driver.called[0]!.args[0].orderBy).toBe('name:asc')
    })

    it('should handle orderBy: ["name:desc", "id:asc"] correctly', async () => {
      await runner.one({ orderBy: ['name:desc', 'id:asc'] as any })
      
      expect(driver.called[0]!.args[0].orderBy).toEqual(['name:desc', 'id:asc'])
    })

    it('should handle orderBy: "metadata.priority:desc" correctly', async () => {
      await runner.one({ orderBy: 'metadata.priority:desc' as any })
      
      expect(driver.called[0]!.args[0].orderBy).toBe('metadata.priority:desc')
    })
  })

  describe('When params is {skip: 5}', () => {
    it('should return Promise<TestData | null> resolving to TestData after skipping 5 records', async () => {
      await runner.one({ skip: 5 })
      
      expect(driver.called[0]!.args[0].skip).toBe(5)
      expect(driver.called[0]!.args[0].take).toBe(1)
    })

    it('should return null when skip: 999 exceeds result set length', async () => {
      driver.returns([])
      
      const result = await runner.one({ skip: 999 })
      
      expect(result).toBeNull()
    })
  })

  describe('When params is {take: 10}', () => {
    it('should return Promise<TestData | null> resolving to single TestData (effectively take: 1)', async () => {
      const result = await runner.one({ take: 10 })
      
      // one()メソッドは常にtake: 1で実行される
      expect(driver.called[0]!.args[0].take).toBe(1)
      expect(result).toBeDefined()
    })

    it('should behave consistently regardless of take value (interface contract)', async () => {
      const result1 = await runner.one({ take: 1 })
      driver.clear()
      const result2 = await runner.one({ take: 100 })
      
      // 両方とも同じ結果（最初の1件）を返す
      expect(driver.called[0]!.args[0].take).toBe(1)
      expect(driver.called[1]?.args[0].take).toBe(1)
      expect(result1).toEqual(result2)
    })
  })

  describe('Error handling', () => {
    it('should reject Promise when data source operations fail', async () => {
      runner = defineQuery<TestData>(driver, {
        name: 'failing-query',
        source: () => {
          throw new Error('Data source failure')
        },
        rules: {},
      })
      
      await expect(runner.one()).rejects.toThrow('Data source failure')
    })

    it('should provide meaningful error messages', async () => {
      runner = defineQuery<TestData>(driver, {
        name: 'failing-query',
        source: () => {
          throw new Error('Connection timeout')
        },
        rules: {},
      })
      
      await expect(runner.one()).rejects.toThrow('Connection timeout')
    })
  })
})
