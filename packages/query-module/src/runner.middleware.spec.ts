import { describe, it, expect, beforeEach, vi } from 'vitest'

import {
  QueryResultList,
  QueryRunnerInterface,
  QueryRunnerMiddleware,
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

describe('QueryRunner - Middleware with many()', () => {
  let driver: TestDriver
  let runner: QueryRunnerInterface<TestData>
  
  const testData: TestData[] = [
    { id: 1, name: 'Alice', status: 'active', email: 'alice@example.com', metadata: { tags: ['user'], priority: 1 } },
    { id: 2, name: 'Bob', status: 'inactive', email: 'bob@example.com', metadata: { tags: ['admin'], priority: 2 } },
  ]

  beforeEach(() => {
    driver = createDriver()
  })

  describe('When QuerySpecification contains middlewares', () => {
    describe('Middleware effects on results', () => {
      it('should return QueryResultList<TestData> with preprocess middleware criteria modifications applied', async () => {
        const preprocessMiddleware: QueryRunnerMiddleware<TestData> = {
          preprocess: vi.fn().mockImplementation((params, context) => {
            // paramsにdefault filterを追加
            if (!params.filter) {
              params.filter = {}
            }
            if (!Array.isArray(params.filter)) {
              params.filter.status = { eq: 'active' }
            }
          })
        }

        runner = defineQuery<TestData>(driver, {
          name: 'middleware-preprocess-query',
          source: () => testData,
          rules: {},
          middlewares: [preprocessMiddleware]
        })

        await runner.many({ filter: { name: { eq: 'Alice' } } })

        expect(preprocessMiddleware.preprocess).toHaveBeenCalled()
        // ミドルウェアによって条件が変更されている
        expect(driver.called[0]?.args[0].filter).toEqual({
          name: { column: null, value: { eq: 'Alice' } },
          status: { column: null, value: { eq: 'active' } }  // ミドルウェアで追加
        })
      })

      it('should return QueryResultList<TestData> with postprocess middleware result modifications applied', async () => {
        const postprocessMiddleware: QueryRunnerMiddleware<TestData> = {
          postprocess: vi.fn().mockImplementation((result, params, context) => {
            // 結果にメタ情報を追加
            result.metadata = { processed: true }
            // データを変換
            result.items = (result.items as any).map((item: any) => ({
              ...item,
              processed: true
            }))
          })
        }

        runner = defineQuery<TestData>(driver, {
          name: 'middleware-postprocess-query',
          source: () => testData,
          rules: {},
          middlewares: [postprocessMiddleware]
        })

        const result = await runner.many()

        expect(postprocessMiddleware.postprocess).toHaveBeenCalled()
        expect((result as any).metadata).toEqual({ processed: true })
        expect((result.items as any)[0].processed).toBe(true)
      })

      it('should handle async middleware operations transparently', async () => {
        const asyncMiddleware: QueryRunnerMiddleware<TestData> = {
          preprocess: vi.fn().mockImplementation(async (params, context) => {
            await new Promise(resolve => setTimeout(resolve, 10))
            params.processedByAsync = true
          }),
          postprocess: vi.fn().mockImplementation(async (result, params, context) => {
            await new Promise(resolve => setTimeout(resolve, 10))
            result.asyncProcessed = true
          })
        }

        runner = defineQuery<TestData>(driver, {
          name: 'async-middleware-query',
          source: () => testData,
          rules: {},
          middlewares: [asyncMiddleware]
        })

        const result = await runner.many()

        expect(asyncMiddleware.preprocess).toHaveBeenCalled()
        expect(asyncMiddleware.postprocess).toHaveBeenCalled()
        expect((result as any).asyncProcessed).toBe(true)
      })
    })

    describe('Multiple middlewares', () => {
      it('should return QueryResultList<TestData> with all middleware effects applied', async () => {
        const middleware1: QueryRunnerMiddleware<TestData> = {
          preprocess: vi.fn().mockImplementation((params) => {
            params.step1 = true
          }),
          postprocess: vi.fn().mockImplementation((result) => {
            result.step1Result = true
          })
        }

        const middleware2: QueryRunnerMiddleware<TestData> = {
          preprocess: vi.fn().mockImplementation((params) => {
            params.step2 = true
          }),
          postprocess: vi.fn().mockImplementation((result) => {
            result.step2Result = true
          })
        }

        runner = defineQuery<TestData>(driver, {
          name: 'multiple-middleware-query',
          source: () => testData,
          rules: {},
          middlewares: [middleware1, middleware2]
        })

        const result = await runner.many()

        // 両方のミドルウェアが実行される
        expect(middleware1.preprocess).toHaveBeenCalled()
        expect(middleware1.postprocess).toHaveBeenCalled()
        expect(middleware2.preprocess).toHaveBeenCalled()
        expect(middleware2.postprocess).toHaveBeenCalled()

        // 結果に両方の効果が適用される
        expect((result as any).step1Result).toBe(true)
        expect((result as any).step2Result).toBe(true)
      })

      it('should maintain consistent Promise<QueryResultList<TestData>> behavior', async () => {
        const middlewares: QueryRunnerMiddleware<TestData>[] = [
          {
            preprocess: vi.fn(),
            postprocess: vi.fn()
          },
          {
            preprocess: vi.fn(),
            postprocess: vi.fn()
          },
          {
            preprocess: vi.fn(),
            postprocess: vi.fn()
          }
        ]

        runner = defineQuery<TestData>(driver, {
          name: 'consistent-middleware-query',
          source: () => testData,
          rules: {},
          middlewares
        })

        const result = await runner.many()

        expect(result).toHaveProperty('items')
        expect(Array.isArray(result.items)).toBe(true)
        expect(result.items).toHaveLength(2)
        
        // 全てのミドルウェアが実行される
        middlewares.forEach(middleware => {
          expect(middleware.preprocess).toHaveBeenCalled()
          expect(middleware.postprocess).toHaveBeenCalled()
        })
      })
    })

    describe('Middleware error handling', () => {
      it('should reject Promise<QueryResultList<TestData>> when middleware processing fails', async () => {
        const failingMiddleware: QueryRunnerMiddleware<TestData> = {
          preprocess: vi.fn().mockImplementation(() => {
            throw new Error('Middleware processing failed')
          })
        }

        runner = defineQuery<TestData>(driver, {
          name: 'failing-middleware-query',
          source: () => testData,
          rules: {},
          middlewares: [failingMiddleware]
        })

        await expect(runner.many()).rejects.toThrow('Middleware processing failed')
        expect(failingMiddleware.preprocess).toHaveBeenCalled()
      })

      it('should provide meaningful error information in rejection', async () => {
        const errorMiddleware: QueryRunnerMiddleware<TestData> = {
          postprocess: vi.fn().mockImplementation(() => {
            throw new Error('Postprocess middleware error with details')
          })
        }

        runner = defineQuery<TestData>(driver, {
          name: 'error-middleware-query',
          source: () => testData,
          rules: {},
          middlewares: [errorMiddleware]
        })

        try {
          await runner.many()
          throw new Error('Should have thrown an error')
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
          expect((error as Error).message).toBe('Postprocess middleware error with details')
        }
      })

      it('should handle async middleware errors correctly', async () => {
        const asyncErrorMiddleware: QueryRunnerMiddleware<TestData> = {
          preprocess: vi.fn().mockImplementation(async () => {
            await new Promise(resolve => setTimeout(resolve, 10))
            throw new Error('Async middleware error')
          })
        }

        runner = defineQuery<TestData>(driver, {
          name: 'async-error-middleware-query',
          source: () => testData,
          rules: {},
          middlewares: [asyncErrorMiddleware]
        })

        await expect(runner.many()).rejects.toThrow('Async middleware error')
        expect(asyncErrorMiddleware.preprocess).toHaveBeenCalled()
      })
    })

    describe('Middleware context', () => {
      it('should provide correct context to middlewares', async () => {
        const contextMiddleware: QueryRunnerMiddleware<TestData> = {
          preprocess: vi.fn(),
          postprocess: vi.fn()
        }

        runner = defineQuery<TestData>(driver, {
          name: 'context-middleware-query',
          source: () => testData,
          rules: {},
          middlewares: [contextMiddleware]
        })

        await runner.many()

        // preprocessとpostprocessに同じpidが渡される
        const preprocessCall = (contextMiddleware.preprocess as any).mock.calls[0]
        const postprocessCall = (contextMiddleware.postprocess as any).mock.calls[0]
        
        expect(preprocessCall[1]).toHaveProperty('pid')
        expect(preprocessCall[1]).toHaveProperty('logger')
        expect(preprocessCall[1]).toHaveProperty('runner')
        
        expect(postprocessCall[2]).toHaveProperty('pid')
        expect(postprocessCall[2]).toHaveProperty('logger')  
        expect(postprocessCall[2]).toHaveProperty('runner')
        
        // 同じpidが使われている
        expect(preprocessCall[1].pid).toBe(postprocessCall[2].pid)
        expect(preprocessCall[1].runner).toBe(postprocessCall[2].runner)
      })
    })
  })
})
