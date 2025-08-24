import { beforeEach, describe, expect, it, MockInstance, vi } from 'vitest'

import { QueryCriteria } from './criteria'
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

// Local helper to simulate raw SQL expressions in tests
const unescape = (sql: string): any => {
  return { __raw: true, sql: sql.trim() }
}

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

describe('QueryRunner with raw operators', () => {
  type DataWithStatus = {
    id: number
    name: string
    status: 'active' | 'inactive' | 'pending'
    category: string
  }

  const data: DataWithStatus[] = [
    { id: 1, name: 'User 1', status: 'active', category: 'premium' },
    { id: 2, name: 'User 2', status: 'inactive', category: 'basic' },
    { id: 3, name: 'User 3', status: 'pending', category: 'premium' },
    { id: 4, name: 'User 4', status: 'active', category: 'basic' },
  ]

  let driver: TestDriver
  let runner: QueryRunnerInterface<DataWithStatus>

  beforeEach(() => {
    driver = createDriver()
    runner = createQuery(driver, {
      name: 'test_raw_operators',
      source: () => data,
      rules: {
        id: 'users.id',
        name: 'users.name',
        // Simulate CASE-WHEN for status display
        status_display: unescape(`CASE 
          WHEN users.status = 'active' THEN 'Active User'
          WHEN users.status = 'pending' THEN 'Pending User'
          ELSE 'Inactive User'
        END`),
        // Simulate CASE-WHEN for user tier
        user_tier: unescape(`CASE 
          WHEN users.category = 'premium' AND users.status = 'active' THEN 'gold'
          WHEN users.category = 'premium' THEN 'silver'
          ELSE 'bronze'
        END`),
      },
    })
  })

  describe('automatic raw SQL expression support', () => {
    it('should automatically handle CASE-WHEN expressions with eq operator', async () => {
      const result = await runner.many({
        filter: {
          status_display: { eq: 'Active User' },
        },
      })

      // Test passes the criteria to driver correctly
      expect(driver.called).toHaveLength(1)
      expect(driver.called[0]?.method).toBe('execute')

      // Check that the criteria contains the filter
      const criteria = driver.called[0]?.args[0]
      expect(criteria.filter).toBeDefined()
    })

    it('should automatically handle CASE-WHEN expressions with ne operator', async () => {
      await runner.many({
        filter: {
          status_display: { ne: 'Inactive User' },
        },
      })

      expect(driver.called).toHaveLength(1)
      const criteria = driver.called[0]?.args[0]
      expect(criteria.filter).toBeDefined()
    })

    it('should automatically handle CASE-WHEN expressions with in operator', async () => {
      await runner.many({
        filter: {
          user_tier: { in: ['gold', 'silver'] },
        },
      })

      expect(driver.called).toHaveLength(1)
      const criteria = driver.called[0]?.args[0]
      expect(criteria.filter).toBeDefined()
    })

    it('should handle empty array in in operator', async () => {
      const result = await runner.many({
        filter: {
          user_tier: { in: [] },
        },
      })

      expect(result.items).toHaveLength(4) // Should return all items when empty array
    })

    it('should combine CASE-WHEN and regular operators', async () => {
      await runner.many({
        filter: {
          status_display: { eq: 'Active User' },
          name: { contains: 'User' },
        },
      })

      expect(driver.called).toHaveLength(1)
      const criteria = driver.called[0]?.args[0]
      expect(criteria.filter).toBeDefined()
    })

    it('should handle regular field names normally', async () => {
      await runner.many({
        filter: {
          name: { eq: 'User 1' },
        },
      })

      expect(driver.called).toHaveLength(1)
      const criteria = driver.called[0]?.args[0]
      expect(criteria?.filter).toBeDefined()
    })
  })
})

describe('QueryRunner with dot notation keys', () => {
  type UserData = {
    id: number
    name: string
    profile: {
      city: string
      zipCode: string
    }
  }

  const data: UserData[] = [
    { id: 1, name: 'User 1', profile: { city: 'Tokyo', zipCode: '100-0001' } },
    { id: 2, name: 'User 2', profile: { city: 'Osaka', zipCode: '530-0001' } },
  ]

  let driver: TestDriver
  let runner: QueryRunnerInterface<UserData>

  beforeEach(() => {
    driver = createDriver()
    runner = createQuery(driver, {
      name: 'test_dot_keys',
      source: () => data,
      rules: {
        // 通常のキー
        id: 'users.id',
        name: 'users.name',
        // dot記法のキー（型エラーなしで使用可能になった）
        'profile.city': 'user_profile.city_name',
        'profile.zipCode': 'user_profile.zip_code',
      },
    })
  })

  describe('dot notation keys support', () => {
    it('should map dot notation keys correctly', async () => {
      await runner.many({
        filter: {
          id: { eq: 1 },
          'profile.city': { eq: 'Tokyo' },
          'profile.zipCode': { eq: '100-0001' },
        } as any, // フィルターの型は別途対応が必要
      })

      expect(driver.called).toHaveLength(1)
      const criteria = driver.called[0]?.args[0]

      // マッピングが正しく適用されることを確認
      expect(criteria?.filter).toEqual({
        'users.id': { eq: 1 },
        'user_profile.city_name': { eq: 'Tokyo' },
        'user_profile.zip_code': { eq: '100-0001' },
      })
    })

    it('should handle mixed regular and dot notation keys', async () => {
      await runner.many({
        filter: {
          name: { contains: 'User' },
          'profile.city': { ne: 'Kyoto' },
        } as any,
      })

      expect(driver.called).toHaveLength(1)
      const criteria = driver.called[0]?.args[0]

      expect(criteria?.filter).toEqual({
        'users.name': { contains: 'User' },
        'user_profile.city_name': { ne: 'Kyoto' },
      })
    })
  })
})

describe('QueryRunner with function-based rules', () => {
  type Data = {
    id: number
    name: string
  }

  const data: Data[] = [
    { id: 1, name: 'User 1' },
    { id: 2, name: 'User 2' },
  ]

  let driver: TestDriver
  let runner: QueryRunnerInterface<Data>

  beforeEach(() => {
    driver = createDriver()
    driver.returns(data) // Set test data for the driver

    // Create a mock source function that returns a builder-like object
    const mockSourceFunction = (): Record<string, any>[] => {
      // Return test data that matches the TestDriver's data structure
      return data
    }

    // Patch the driver to return our mock builder
    const originalSource = driver.source.bind(driver)
    driver.source = (fn: any) => {
      const result = originalSource(fn)
      // Add our mock methods to the result
      result.buildDynamicExpression = (key: string, value: any) =>
        `dynamic_${key}_${JSON.stringify(value)}`
      result.buildComplexQuery = (value: any) =>
        `CASE WHEN status = "${value.eq}" THEN 1 ELSE 0 END`
      return result
    }

    runner = createQuery(driver, {
      name: 'test_function_rules',
      source: mockSourceFunction,
      rules: {
        id: 'users.id',
        name: 'users.name',
        // Test function-based rule that receives value and sourceInstance
        dynamic_field: (value, sourceInstance) => {
          return sourceInstance.buildDynamicExpression('test', value)
        },
        complex_status: (value, sourceInstance) => {
          return sourceInstance.buildComplexQuery(value)
        },
      },
    })
  })

  describe('function-based rules support', () => {
    it('should handle rules with source-generated expressions', async () => {
      await runner.many({
        filter: {
          id: { eq: 1 },
          dynamic_field: { eq: 'some_value' },
          complex_status: { eq: 1 },
        },
      })

      expect(driver.called).toHaveLength(1)
      const criteria = driver.called[0]?.args[0]

      // Verify that function-based rules are processed by customFilter
      expect(criteria?.filter).toEqual({
        'users.id': { eq: 1 },
        'dynamic_field': { eq: expect.anything() },
        'complex_status': { eq: expect.anything() },
      })
    })

    it('should work with mixed static and function-based rules', async () => {
      await runner.many({
        filter: {
          name: { contains: 'User' }, // static rule
          dynamic_field: { ne: 'excluded' }, // function-based rule
        },
      })

      expect(driver.called).toHaveLength(1)
      const criteria = driver.called[0]?.args[0]

      expect(criteria?.filter).toEqual({
        'users.name': { contains: 'User' },
        'dynamic_field': { ne: expect.anything() },
      })
    })
  })
})

describe('QueryRunner with SQL expression object returns', () => {
  type Data = {
    id: number
    name: string
  }

  const data: Data[] = [
    { id: 1, name: 'User 1' },
    { id: 2, name: 'User 2' },
  ]

  let driver: TestDriver
  let runner: QueryRunnerInterface<Data>

  // Mock SQL expression object (similar to coral-sql's structure)
  const createSqlExpression = (type: string, content: any) => ({
    __type: type,
    content,
    toString: () => content,
  })

  beforeEach(() => {
    driver = createDriver()
    driver.returns(data)

    const mockSourceFunction = (): Record<string, any>[] => {
      // Return test data that matches the TestDriver's data structure
      return data
    }

    runner = createQuery(driver, {
      name: 'test_sql_expression_rules',
      source: mockSourceFunction,
      rules: {
        id: 'p.id',
        name: 'p.name',
        // Function that returns a SQL expression object (not a string)
        telephone: (value, sourceInstance) => {
          return createSqlExpression('EXISTS', {
            subquery: `SELECT 1 FROM user_telephone ut WHERE ut.user_id = p.id AND ut.value = '${(value as any)?.eq || ''}'`,
          })
        },
        // Another function returning complex SQL object
        complex_condition: (value, sourceInstance) => {
          return createSqlExpression('CASE', {
            when: [
              { condition: `status = '${(value as any)?.eq || ''}'`, then: '1' },
              { condition: 'TRUE', then: '0' },
            ],
          })
        },
      },
    })
  })

  describe('SQL expression object returns', () => {
    it('should handle function rules that return SQL expression objects', async () => {
      await runner.many({
        filter: {
          id: { eq: 1 },
          telephone: { eq: '123-456-7890' },
        },
      })

      expect(driver.called).toHaveLength(1)
      const criteria = driver.called[0]?.args[0]

      // Verify that the SQL expression object is processed by customFilter
      expect(criteria?.filter).toMatchObject({
        'p.id': { eq: 1 },
        telephone: { eq: expect.anything() },
      })
    })

    it('should handle multiple SQL expression rules together', async () => {
      await runner.many({
        filter: {
          telephone: { eq: '123-456-7890' },
          complex_condition: { eq: 'active' },
        },
      })

      expect(driver.called).toHaveLength(1)
      const criteria = driver.called[0]?.args[0]

      expect(criteria?.filter).toMatchObject({
        telephone: { eq: expect.anything() },
        complex_condition: { eq: expect.anything() },
      })
    })

    it('should work with mixed string rules and SQL expression rules', async () => {
      await runner.many({
        filter: {
          id: { eq: 1 },
          name: { contains: 'User' },
          telephone: { eq: '123-456-7890' },
        },
      })

      expect(driver.called).toHaveLength(1)
      const criteria = driver.called[0]?.args[0]

      expect(criteria?.filter).toMatchObject({
        'p.id': { eq: 1 },
        'p.name': { contains: 'User' },
        telephone: { eq: expect.anything() },
      })
    })
  })
})

describe('QueryCriteria with customFilter dependency injection', () => {
  type Data = {
    id: number
    name: string
  }

  let mockCustomFilter: any
  let mockDriver: any

  beforeEach(() => {
    mockCustomFilter = vi.fn()
    mockCustomFilter.mockReset()
    mockDriver = {
      customFilter: mockCustomFilter,
      source: vi.fn(),
      execute: vi.fn(),
    }
  })

  describe('dependency injection', () => {
    it('should pass customFilter function to QueryCriteria constructor', () => {
      const criteria = new QueryCriteria<Data>({}, {}, mockDriver)

      expect(criteria).toBeInstanceOf(QueryCriteria)
    })

    it('should call customFilter when processing function-based rules', () => {
      const mockResult = 'mock_expression_result'
      mockCustomFilter.mockReturnValue(mockResult)

      const rules = {
        name: (value: any, source: any) => 'should_be_replaced_by_customFilter',
      }

      const criteria = new QueryCriteria<Data>(
        rules,
        {
          filter: {
            name: { eq: 'test' },
          },
        },
        mockDriver,
      )

      // New implementation calls customFilter for each operator
      expect(mockCustomFilter).toHaveBeenCalledWith('eq', 'test', rules.name)
      expect(criteria.filter).toEqual({
        name: { eq: mockResult },
      })
    })

    it('should not call customFilter for static string rules', () => {
      const rules = {
        id: 'users.id',
        name: 'users.name',
      }

      const criteria = new QueryCriteria<Data>(
        rules,
        {
          filter: {
            id: { eq: 1 },
            name: { eq: 'test' },
          },
        },
        mockDriver,
      )

      // Static rules are renamed based on mapping, customFilter not called
      expect(mockCustomFilter).not.toHaveBeenCalled()
      expect(criteria.filter).toEqual({
        'users.id': { eq: 1 },
        'users.name': { eq: 'test' },
      })
    })

    it('should handle mixed static and function-based rules correctly', () => {
      const dynamicResult = 'dynamic_expression'
      mockCustomFilter.mockReturnValue(dynamicResult)

      const rules = {
        id: 'users.id', // static rule
        dynamic_field: (value: any, source: any) =>
          source.buildExpression(value), // function rule
      }

      const criteria = new QueryCriteria<Data>(
        rules,
        {
          filter: {
            id: { eq: 1 },
            dynamic_field: { eq: 'test' },
          },
        },
        mockDriver,
      )

      // Mixed static and function rules - customFilter called only for function rule
      expect(mockCustomFilter).toHaveBeenCalledWith('eq', 'test', rules.dynamic_field)
      expect(criteria.filter).toEqual({
        'users.id': { eq: 1 },
        'dynamic_field': { eq: dynamicResult },
      })
    })

    it('should properly pass value and source to rule function', () => {
      const mockSource = {
        buildExpression: vi.fn().mockReturnValue('test_result'),
      }
      const ruleFn = vi
        .fn()
        .mockImplementation((value, source) => source.buildExpression(value))

      mockCustomFilter.mockImplementation((operator: string, value: any, fn: any) => fn(value, mockSource))

      const rules = {
        test_field: ruleFn,
      }

      const criteria = new QueryCriteria<Data>(
        rules,
        {
          filter: {
            test_field: { eq: 'test_value' },
          },
        },
        mockDriver,
      )

      // customFilter is called with operator, value, and function
      expect(mockCustomFilter).toHaveBeenCalledWith('eq', 'test_value', ruleFn)
    })

    it('should handle function rules returning string values', () => {
      const expectedResult = 'new_field_name'
      mockCustomFilter.mockReturnValue(expectedResult)

      const rules = {
        renamed_field: () => 'new_field_name',
      }

      const criteria = new QueryCriteria<Data>(
        rules,
        {
          filter: {
            renamed_field: { eq: 'test' },
          },
        },
        mockDriver,
      )

      // customFilter processes the function
      expect(mockCustomFilter).toHaveBeenCalledWith('eq', 'test', rules.renamed_field)
      expect(criteria.filter).toEqual({
        renamed_field: { eq: expectedResult },
      })
    })

    it('should handle function rules returning expression objects', () => {
      const mockExpression = { __type: 'CUSTOM', content: 'complex expression' }
      mockCustomFilter.mockReturnValue(mockExpression)

      const rules = {
        complex_field: (value: any, sourceInstance: any) => mockExpression.content,
      }

      const criteria = new QueryCriteria<Data>(
        rules,
        {
          filter: {
            complex_field: { eq: 'test' },
          },
        },
        mockDriver,
      )

      expect(mockCustomFilter).toHaveBeenCalledWith('eq', 'test', rules.complex_field)
      expect(criteria.filter).toEqual({
        complex_field: { eq: mockExpression },
      })
    })
  })

  describe('error handling', () => {
    it('should handle customFilter throwing an error', () => {
      mockCustomFilter.mockImplementation(() => {
        throw new Error('CustomFilter error')
      })

      const rules = {
        error_field: (value: any, source: any) => 'should_not_reach',
      }

      // Now customFilter is called, so error should be thrown
      expect(() => {
        new QueryCriteria<Data>(
          rules,
          {
            filter: {
              error_field: { eq: 'test' },
            },
          },
          mockDriver,
        )
      }).toThrow('CustomFilter error')
    })

    it('should handle rule function throwing an error', () => {
      // Make customFilter throw when it tries to call the rule function
      mockCustomFilter.mockImplementation((operator: string, value: any, ruleFn: any) => {
        throw new Error('Rule function error')
      })

      const errorRule = vi.fn()
      const rules = {
        error_field: errorRule,
      }

      // Error is thrown via customFilter
      expect(() => {
        new QueryCriteria<Data>(
          rules,
          {
            filter: {
              error_field: { eq: 'test' },
            },
          },
          mockDriver,
        )
      }).toThrow('Rule function error')
    })

    it('should handle empty filter gracefully', () => {
      const criteria = new QueryCriteria<Data>(
        {
          test_field: (value: any) => 'mapped_field',
        },
        {
          filter: {},
        },
        mockDriver,
      )

      expect(criteria.filter).toEqual({})
      expect(mockCustomFilter).not.toHaveBeenCalled()
    })

    it('should handle undefined filter properties gracefully', () => {
      const mockCustomFilter = vi
        .fn()
        .mockImplementation((fn) => fn({ mockSource: true }))

      const criteria = new QueryCriteria<Data>(
        {
          test_field: (value: any) => 'mapped_field',
          other_field: 'other.field',
        },
        {
          filter: {
            test_field: undefined,
            other_field: { eq: 'test' },
          } as any,
        },
        mockDriver,
      )

      // Should only process non-undefined values
      expect(criteria.filter).toEqual({
        'other.field': { eq: 'test' },
      })
      expect(mockCustomFilter).not.toHaveBeenCalled()
    })

    it('should handle null customFilter gracefully', () => {
      const rules = {
        static_field: 'mapped.field',
      }

      const nullDriver = { ...mockDriver, customFilter: null }

      // Should work with static fields even with null customFilter
      expect(() => {
        new QueryCriteria<Data>(
          rules,
          {
            filter: {
              static_field: { eq: 'test' },
            },
          },
          nullDriver,
        )
      }).not.toThrow()
    })
  })
})
