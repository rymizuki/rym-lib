import { beforeEach, describe, expect, it, vi } from 'vitest'

import { defineQuery } from './functions/define-query'
import { QueryRunnerMiddleware, QueryRunnerWithCount } from './interfaces'
import { createDriver, TestDriver } from './test-utils/test-driver'

type TestData = {
  id: number
  name: string
  status: 'active' | 'inactive'
}

const testData: TestData[] = [
  { id: 1, name: 'Alice', status: 'active' },
  { id: 2, name: 'Bob', status: 'inactive' },
  { id: 3, name: 'Charlie', status: 'active' },
]

describe('QueryRunner - Method: count(params?)', () => {
  let driver: TestDriver

  beforeEach(() => {
    driver = createDriver()
  })

  describe('When spec.count is true', () => {
    let runner: QueryRunnerWithCount<TestData>

    beforeEach(() => {
      runner = defineQuery<TestData>(driver, {
        name: 'test-count',
        source: () => testData,
        rules: { status: 'status' },
        count: true,
      })
    })

    it('should call driver.executeCount with criteria', async () => {
      await runner.count()

      expect(driver.called).toHaveLength(1)
      expect(driver.called[0]!.method).toBe('executeCount')
    })

    it('should return total count without filter', async () => {
      const count = await runner.count()

      expect(count).toBe(3)
    })

    it('should pass filter criteria to driver.executeCount', async () => {
      await runner.count({
        filter: { status: { eq: 'active' } },
      })

      expect(driver.called[0]!.method).toBe('executeCount')
      const criteria = driver.called[0]!.args[0]
      expect(criteria.filter).toBeDefined()
    })

    it('should return number reflecting driver result', async () => {
      driver.returns([
        { id: 1, name: 'Alice', status: 'active' },
        { id: 2, name: 'Bob', status: 'inactive' },
      ])
      const count = await runner.count()

      expect(count).toBe(2)
    })

    it('should not mutate caller params', async () => {
      const params = { filter: { status: { eq: 'active' } } }
      const snapshot = JSON.parse(JSON.stringify(params))

      await runner.count(params)

      expect(params).toEqual(snapshot)
    })

    it('should run preprocess middleware', async () => {
      const preprocess = vi.fn()
      const middleware: QueryRunnerMiddleware<TestData> = { preprocess }
      const r = defineQuery<TestData>(driver, {
        name: 'mw-count',
        source: () => testData,
        rules: {},
        middlewares: [middleware],
        count: true,
      })

      await r.count()

      expect(preprocess).toHaveBeenCalledTimes(1)
    })

    it('should not run postprocess middleware', async () => {
      const postprocess = vi.fn()
      const middleware: QueryRunnerMiddleware<TestData> = { postprocess }
      const r = defineQuery<TestData>(driver, {
        name: 'mw-count',
        source: () => testData,
        rules: {},
        middlewares: [middleware],
        count: true,
      })

      await r.count()

      expect(postprocess).not.toHaveBeenCalled()
    })

    it('should run multiple preprocess middlewares in registration order', async () => {
      const order: string[] = []
      const r = defineQuery<TestData>(driver, {
        name: 'mw-order',
        source: () => testData,
        rules: {},
        middlewares: [
          { preprocess: () => void order.push('first') },
          { preprocess: () => void order.push('second') },
        ],
        count: true,
      })

      await r.count()

      expect(order).toEqual(['first', 'second'])
    })

    it('should pass spec.criteria-transformed params to driver.executeCount', async () => {
      const r = defineQuery<TestData>(driver, {
        name: 'criteria-count',
        source: () => testData,
        rules: { status: 'status' },
        criteria: () => ({ filter: { status: { eq: 'active' } } }),
        count: true,
      })

      await r.count()

      const passedCriteria = driver.called[0]!.args[0]
      expect(passedCriteria.filter).toBeDefined()
    })

    it('should return 0 when driver reports no rows', async () => {
      driver.returns([])
      const count = await runner.count()

      expect(count).toBe(0)
    })
  })

  describe('When spec.count is not set', () => {
    it('should not expose count() in the returned type', () => {
      const runner = defineQuery<TestData>(driver, {
        name: 'no-count',
        source: () => testData,
        rules: {},
      })

      // @ts-expect-error - count is not available when spec.count is not true
      runner.count
    })
  })

  describe('When spec.count is false', () => {
    it('should not expose count() in the returned type', () => {
      const runner = defineQuery<TestData>(driver, {
        name: 'no-count',
        source: () => testData,
        rules: {},
        count: false,
      })

      // @ts-expect-error - count is not available when spec.count is false
      runner.count
    })
  })

  describe('Type-level driver requirement', () => {
    it('should reject drivers without executeCount when spec.count is true', () => {
      const driverWithoutCount: import('./interfaces').QueryDriverInterface = {
        source() {
          return this
        },
        async execute() {
          return []
        },
      }

      // Type-only assertion: this call is wrapped in a never-executed branch
      // so we only verify the @ts-expect-error directive triggers correctly.
      const _typeCheck = () =>
        defineQuery<TestData>(
          // @ts-expect-error - driver missing executeCount cannot be used with count: true
          driverWithoutCount,
          {
            name: 'no-execute-count-driver',
            source: () => testData,
            rules: {},
            count: true,
          },
        )
      expect(typeof _typeCheck).toBe('function')
    })
  })
})
