// @ts-nocheck
import { describe, it, expect, beforeEach } from 'vitest'

import {
  QueryResultList,
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

describe('QueryRunner - Rules Mapping with many()', () => {
  let driver: TestDriver
  let runner: QueryRunnerInterface<TestData>
  
  const testData: TestData[] = [
    { id: 1, name: 'Alice', status: 'active', email: 'alice@example.com', metadata: { tags: ['user'], priority: 1 } },
    { id: 2, name: 'Bob', status: 'inactive', email: 'bob@example.com', metadata: { tags: ['admin'], priority: 2 } },
  ]

  beforeEach(() => {
    driver = createDriver()
  })

  describe('Filter with spec.rules property mapping', () => {
    beforeEach(() => {
      runner = defineQuery<TestData>(driver, {
        name: 'mapped-query',
        source: () => testData,
        rules: {
          name: 'user_name',
          id: 'user_id',
          'metadata.priority': 'priority_score'
        },
      })
    })

    it('should map filter keys using spec.rules: {name: "user_name", id: "user_id"}', async () => {
      await runner.many({ 
        filter: { 
          name: { eq: 'Alice' },
          id: { eq: 1 }
        } 
      })
      
      // ドライバーに渡される際、プロパティ名がマッピングされている
      expect(driver.called[0]?.args[0].filter).toEqual({
        user_name: { eq: 'Alice' },
        user_id: { eq: 1 }
      })
    })

    it('should handle spec.rules with dot notation: {"metadata.priority": "priority_score"}', async () => {
      await runner.many({ 
        filter: { 
          'metadata.priority': { gte: 2 } as any
        } 
      })
      
      expect(driver.called[0]?.args[0].filter).toEqual({
        priority_score: { gte: 2 }
      })
    })

    it('should preserve unmapped keys when not in spec.rules', async () => {
      await runner.many({ 
        filter: { 
          name: { eq: 'Alice' },
          status: { eq: 'active' },  // statusはマッピングされていない
          email: { ne: null }        // emailもマッピングされていない
        } 
      })
      
      expect(driver.called[0]?.args[0].filter).toEqual({
        user_name: { eq: 'Alice' },  // マッピングされた
        status: { eq: 'active' },    // そのまま
        email: { ne: null }          // そのまま
      })
    })
  })

  describe('Property mapping rules', () => {
    describe('Basic mapping', () => {
      beforeEach(() => {
        runner = defineQuery<TestData>(driver, {
          name: 'basic-mapping-query',
          source: () => testData,
          rules: {
            name: 'full_name',
            id: 'record_id'
          },
        })
      })

      it('should map simple property names', async () => {
        await runner.many({ filter: { name: { eq: 'Alice' } } })
        
        expect(driver.called[0]?.args[0].filter).toEqual({
          full_name: { eq: 'Alice' }
        })
      })

      it('should handle unmapped properties', async () => {
        await runner.many({ filter: { status: { eq: 'active' } } })
        
        expect(driver.called[0]?.args[0].filter).toEqual({
          status: { eq: 'active' }
        })
      })

      it('should preserve original property names when no mapping exists', async () => {
        await runner.many({ 
          filter: { 
            email: { ne: null },
            status: { eq: 'active' }
          } 
        })
        
        expect(driver.called[0]?.args[0].filter).toEqual({
          email: { ne: null },
          status: { eq: 'active' }
        })
      })
    })

    describe('Dot notation mapping', () => {
      beforeEach(() => {
        runner = defineQuery<TestData>(driver, {
          name: 'dot-notation-query',
          source: () => testData,
          rules: {
            'metadata.tags': 'user_tags',
            'metadata.priority': 'user_priority'
          },
        })
      })

      it('should handle dot notation in source keys', async () => {
        await runner.many({ 
          filter: { 
            'metadata.tags': { contains: 'user' } as any
          } 
        })
        
        expect(driver.called[0]?.args[0].filter).toEqual({
          user_tags: { contains: 'user' }
        })
      })

      it('should handle dot notation in target keys', async () => {
        runner = defineQuery<TestData>(driver, {
          name: 'target-dot-query',
          source: () => testData,
          rules: {
            name: 'user.full_name'
          },
        })
        
        await runner.many({ filter: { name: { eq: 'Alice' } } })
        
        expect(driver.called[0]?.args[0].filter).toEqual({
          'user.full_name': { eq: 'Alice' }
        })
      })

      it('should handle nested object mapping', async () => {
        await runner.many({ 
          filter: { 
            'metadata.priority': { gte: 1 } as any,
            'metadata.tags': { in: ['user', 'admin'] } as any
          } 
        })
        
        expect(driver.called[0]?.args[0].filter).toEqual({
          user_priority: { gte: 1 },
          user_tags: { in: ['user', 'admin'] }
        })
      })
    })

    describe('Complex mapping scenarios', () => {
      beforeEach(() => {
        runner = defineQuery<TestData>(driver, {
          name: 'complex-mapping-query',
          source: () => testData,
          rules: {
            id: 'record_id',
            name: 'user_name',
            'metadata.priority': 'priority'
          },
        })
      })

      it('should handle partial mapping', async () => {
        await runner.many({ 
          filter: { 
            id: { eq: 1 },
            name: { eq: 'Alice' },
            status: { eq: 'active' },  // マッピングなし
            email: { ne: null }        // マッピングなし
          } 
        })
        
        expect(driver.called[0]?.args[0].filter).toEqual({
          record_id: { eq: 1 },
          user_name: { eq: 'Alice' },
          status: { eq: 'active' },
          email: { ne: null }
        })
      })

      it('should handle case-sensitive mappings', async () => {
        runner = defineQuery<TestData>(driver, {
          name: 'case-sensitive-query',
          source: () => testData,
          rules: {
            name: 'Name',      // 大文字
            email: 'EMAIL'     // 全て大文字
          },
        })
        
        await runner.many({ 
          filter: { 
            name: { eq: 'Alice' },
            email: { ne: null }
          } 
        })
        
        expect(driver.called[0]?.args[0].filter).toEqual({
          Name: { eq: 'Alice' },
          EMAIL: { ne: null }
        })
      })
    })
  })

  describe('Criteria transformation', () => {
    describe('When QuerySpecification.criteria function is provided', () => {
      beforeEach(() => {
        runner = defineQuery<TestData>(driver, {
          name: 'criteria-transform-query',
          source: () => testData,
          rules: {},
          criteria: (params) => {
            // 条件を変換する例：statusがactiveの場合、emailも必須にする
            if (params.filter && !Array.isArray(params.filter) && params.filter.status?.eq === 'active') {
              return {
                ...params,
                filter: {
                  ...params.filter,
                  email: { ne: null }
                }
              }
            }
            return params
          }
        })
      })

      it('should apply criteria transformation to parameters', async () => {
        await runner.many({ filter: { status: { eq: 'active' } } })
        
        // 変換後の条件がドライバーに渡される
        expect(driver.called[0]?.args[0].filter).toEqual({
          status: { eq: 'active' },
          email: { ne: null }  // 変換で追加された
        })
      })

      it('should return Promise<QueryResultList<TestData>> with transformed criteria', async () => {
        const result = await runner.many({ filter: { status: { eq: 'active' } } })
        
        expect(result).toHaveProperty('items')
        expect(Array.isArray(result.items)).toBe(true)
        // 変換された条件でクエリが実行される
        expect(driver.called[0]?.args[0].filter.email).toEqual({ ne: null })
      })
    })

    describe('When no criteria function is provided', () => {
      beforeEach(() => {
        runner = defineQuery<TestData>(driver, {
          name: 'no-transform-query',
          source: () => testData,
          rules: {},
          // criteria関数なし
        })
      })

      it('should use parameters directly without transformation', async () => {
        const params = { filter: { status: { eq: 'active' } } }
        
        await runner.many(params)
        
        expect(driver.called[0]?.args[0].filter).toEqual(params.filter)
      })

      it('should not modify original params object', async () => {
        const params = { filter: { status: { eq: 'active' } } }
        const originalFilter = { ...params.filter }
        
        await runner.many(params)
        
        expect(params.filter).toEqual(originalFilter)
      })
    })
  })
})
