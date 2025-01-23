import { beforeEach, describe, expect, it, MockInstance, vi } from 'vitest'

import { QueryRunnerResourceNotFoundException } from './exceptions'
import { defineQuery } from './functions/define-query'
import {
  QueryDriverInterface,
  QueryRunnerInterface,
  QueryRunnerMiddleware,
  QuerySpecification,
} from './interfaces'
import { createDriver, TestDriver } from './test-utils/test-driver'
import { createLogger, TestMockLogger } from './test-utils/test-mock-logger'

type Data = {
  index: number
  value: string
}

describe('QueryRunner', () => {
  // region setup
  const data = [
    { index: 0, value: 'item-1' },
    { index: 1, value: 'item-2' },
    { index: 3, value: 'item-3' },
  ]

  describe('basic', () => {
    let driver: TestDriver
    let runner: QueryRunnerInterface<Data>
    beforeEach(() => {
      driver = createDriver()
      runner = createQuery(driver, {
        name: 'test',
        source: () => data,
        rules: {},
      })
    })

    // region .many()
    describe('.many(criteria)', () => {
      describe('criteria: undefined', () => {
        let result: any
        beforeEach(async () => {
          result = await runner.many()
        })

        it('should be return strict data', async () => {
          expect(result).toStrictEqual({ items: data })
        })
        it('should be call with empty criteria', () => {
          expect(driver.called[0]?.args[0].filter).toStrictEqual({})
          expect(driver.called[0]?.args[0].orderBy).toBeUndefined()
          expect(driver.called[0]?.args[0].skip).toBeUndefined()
          expect(driver.called[0]?.args[0].take).toBeUndefined()
        })
      })
      describe('criteria: {filter: {id: {eq: 12345}}, orderBy: "id:desc", skip: 5, take: 10}', () => {
        const criteria = {
          filter: { index: { eq: 1 } },
          orderBy: 'index:desc',
          skip: 5,
          take: 10,
        } as const
        let result: any
        beforeEach(async () => {
          result = await runner.many(criteria)
        })

        it('should be return strict data', async () => {
          expect(result).toStrictEqual({ items: data })
        })
        it('should be call with specified criteria', () => {
          expect(driver.called[0]?.args[0].filter).toStrictEqual(
            criteria.filter,
          )
          expect(driver.called[0]?.args[0].orderBy).toBe(criteria.orderBy)
          expect(driver.called[0]?.args[0].skip).toBe(criteria.skip)
          expect(driver.called[0]?.args[0].take).toBe(criteria.take)
        })
      })
      describe('criteria: {filter: [{id: {eq: 12345}}, {id: {ne: 54321}}]}', () => {
        const criteria = {
          filter: [{ index: { eq: 1 } }, { index: { ne: 5 } }],
        }
        let result: any
        beforeEach(async () => {
          result = await runner.many(criteria)
        })

        it('should be return strict data', async () => {
          expect(result).toStrictEqual({ items: data })
        })
        it('should be call with specified criteria', () => {
          expect(driver.called[0]?.args[0].filter).toStrictEqual(
            criteria.filter,
          )
        })
      })
    })

    // region .one()
    describe('.one(criteria)', () => {
      describe('criteria: undefined', () => {
        let result: any
        beforeEach(async () => {
          result = await runner.one()
        })

        it('should be return strict data[0]', async () => {
          expect(result).toStrictEqual(data[0])
        })
        it('should be call with empty criteria', () => {
          expect(driver.called[0]?.args[0].filter).toStrictEqual({})
          expect(driver.called[0]?.args[0].orderBy).toBeUndefined()
          expect(driver.called[0]?.args[0].skip).toBeUndefined()
          expect(driver.called[0]?.args[0].take).toBe(1)
        })
      })

      describe('criteria: {filter: {id: {eq: 12345}}, orderBy: "id:desc", skip: 5, take: 10}', () => {
        const criteria = {
          filter: { index: { eq: 1 } },
          orderBy: 'index:desc',
          skip: 5,
          take: 10,
        } as const
        let result: any
        beforeEach(async () => {
          result = await runner.one(criteria)
        })

        it('should be return strict data[0]', async () => {
          expect(result).toStrictEqual(data[0])
        })
        it('should be call with specified criteria', () => {
          expect(driver.called[0]?.args[0].filter).toStrictEqual(
            criteria.filter,
          )
          expect(driver.called[0]?.args[0].orderBy).toBe(criteria.orderBy)
          expect(driver.called[0]?.args[0].skip).toBe(criteria.skip)
          expect(driver.called[0]?.args[0].take).toBe(1)
        })
      })

      describe('non match records', () => {
        it('should be return null', async () => {
          driver.returns([])
          expect(await runner.one()).toBeNull()
        })
      })
    })

    // region .find()
    describe('.find(criteria)', () => {
      describe('criteria: {filter: {id: {eq: 12345}}, orderBy: "id:desc", skip: 5, take: 10}', () => {
        const criteria = {
          filter: { index: { eq: 1 } },
          orderBy: 'index:desc',
          skip: 5,
          take: 10,
        } as const
        let result: any
        beforeEach(async () => {
          result = await runner.find(criteria)
        })

        it('should be return strict data[0]', async () => {
          expect(result).toStrictEqual(data[0])
        })
        it('should be call with specified criteria', () => {
          expect(driver.called[0]?.args[0].filter).toStrictEqual(
            criteria.filter,
          )
          expect(driver.called[0]?.args[0].orderBy).toBe(criteria.orderBy)
          expect(driver.called[0]?.args[0].skip).toBe(criteria.skip)
          expect(driver.called[0]?.args[0].take).toBe(1)
        })
      })

      describe('non match records', () => {
        it('should be throws exception', async () => {
          driver.returns([])
          await expect(async () => await runner.find({})).rejects.toThrowError(
            QueryRunnerResourceNotFoundException,
          )
        })
      })
    })
  })

  describe('properties mapping rules', () => {
    let driver: TestDriver
    let runner: QueryRunnerInterface<Data>
    beforeEach(() => {
      driver = createDriver()
      runner = createQuery(driver, {
        name: 'test',
        source: () => data,
        rules: {
          index: 'record.id',
          value: 'record.value',
        },
      })
    })

    describe('specify empty criteria', () => {
      it('should be pass to empty criteria', async () => {
        await runner.many()
        expect(driver.called[0]?.args[0]?.filter).toStrictEqual({})
      })
    })

    describe('specify criteria', () => {
      beforeEach(async () => {
        await runner.many({
          filter: {
            index: { gte: 0 },
            value: { ne: 'item-1' },
          },
          orderBy: 'index:asc',
        })
      })

      describe('criteria.filter', () => {
        it('should be replaced name for index, value', () => {
          expect(driver.called[0]?.args[0]?.filter).toStrictEqual({
            'record.id': { gte: 0 },
            'record.value': { ne: 'item-1' },
          })
        })
      })
      describe.skip('criteria.orderBy', () => {
        it('should be replaced name for index, value', () => {
          expect(driver.called[0]?.args[0]?.orderBy).toBe('record.id:index')
        })
      })
    })
  })

  describe('middleware support', () => {
    describe('basic', () => {
      let driver: TestDriver
      let middleware: QueryRunnerMiddleware<Data>
      let runner: QueryRunnerInterface<Data>
      beforeEach(() => {
        middleware = {
          preprocess: vi.fn(),
          postprocess: vi.fn(),
        }

        driver = createDriver()
        runner = createQuery(driver, {
          name: 'test',
          source: () => data,
          rules: {},
          middlewares: [middleware],
        })
      })

      let result: any
      beforeEach(async () => {
        result = await runner.many({
          filter: {
            index: { eq: 0 },
          },
          orderBy: 'index:asc',
          take: 10,
          skip: 1,
        })
      })

      describe('preprocess', () => {
        let callArgs: any
        beforeEach(() => {
          callArgs =
            (middleware.preprocess as any as MockInstance).mock.lastCall ?? []
        })

        describe('called with criteria', () => {
          it("should be equals driver' criteria", () => {
            expect(callArgs[0]).toStrictEqual({
              filter: driver.called[0]?.args[0]?.filter,
              orderBy: driver.called[0]?.args[0]?.orderBy,
              take: driver.called[0]?.args[0]?.take,
              skip: driver.called[0]?.args[0]?.skip,
            })
          })
        })
        describe('called with context', () => {
          it('should be have property logger', () => {
            expect(callArgs[1]?.logger).toBeInstanceOf(TestMockLogger)
          })
          it('should be have property pid, and equals postprocess.pid', () => {
            expect(callArgs[1]?.pid).toBe(
              (middleware.postprocess as any as MockInstance).mock.lastCall?.[2]
                .pid,
            )
          })
          it('should be have property runner, and equals current runner', () => {
            expect(callArgs[1]?.runner).toStrictEqual(runner)
          })
        })
      })
      describe('postprocess', () => {
        let callArgs: any[]
        beforeEach(() => {
          callArgs =
            (middleware.postprocess as any as MockInstance).mock.lastCall ?? []
        })

        describe('called with result', () => {
          it('should be equals query result', () => {
            expect(callArgs[0]).toStrictEqual({ items: data })
          })
        })
        describe('called with criteria', () => {
          it('should be equals specified driver criteria', () => {
            expect(callArgs[1]).toStrictEqual({
              filter: driver.called[0]?.args[0].filter,
              orderBy: driver.called[0]?.args[0].orderBy,
              take: driver.called[0]?.args[0].take,
              skip: driver.called[0]?.args[0].skip,
            })
          })
        })
        describe('called with context', () => {
          it('should be have property logger', () => {
            expect(callArgs[2]?.logger).toBeInstanceOf(TestMockLogger)
          })
          it("should be have property pid, and equals preprocess's pid", () => {
            expect(callArgs[2]?.pid).toBe(
              (middleware.preprocess as any as MockInstance).mock.lastCall?.[1]
                ?.pid,
            )
          })
          it('should be have property runner, and equals current runner', () => {
            expect(callArgs[2]?.runner).toStrictEqual(runner)
          })
        })
      })
    })
  })
})

function createQuery<
  Data,
  Driver extends QueryDriverInterface,
  Spec extends QuerySpecification<Data, Driver>,
>(driver: Driver, spec: Spec) {
  const runner = defineQuery<Data, Driver>(driver, spec, {
    logger: createLogger(),
  })
  return runner
}
