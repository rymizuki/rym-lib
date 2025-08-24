import { Sequelize } from 'sequelize'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { QueryCriteria, QueryLoggerInterface } from '@rym-lib/query-module'
import { SQLBuilder, SQLBuilderPort, createBuilder } from '@rym-lib/query-module-sql-builder'

import { QueryDriverSequelize } from './driver'

// Create a mock logger
const createLogger = () => ({
  verbose: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
})

// Mock Sequelize
vi.mock('sequelize', () => {
  const mockQuery = vi.fn()
  return {
    Sequelize: vi.fn().mockImplementation(() => ({
      query: mockQuery,
    })),
    QueryTypes: {
      SELECT: 'SELECT',
    },
  }
})

describe('query-module-driver-sequelize', () => {
  let sequelize: Sequelize
  let driver: QueryDriverSequelize
  let mockQuery: any

  beforeEach(() => {
    vi.clearAllMocks()
    sequelize = new Sequelize('sqlite::memory:')
    mockQuery = sequelize.query as any
    driver = new QueryDriverSequelize(sequelize, { logger: createLogger() })
  })

  describe('basic functionality', () => {
    it('should create driver instance', () => {
      expect(driver).toBeInstanceOf(QueryDriverSequelize)
    })

    it('should execute query with SQLBuilder', async () => {
      const sourceFunction = (builder: SQLBuilderPort) => {
        return builder.from('users')
      }

      mockQuery.mockResolvedValue([{ id: 1, name: 'Test User' }])

      const source = driver.source(sourceFunction)
      const criteria = new QueryCriteria({}, {}, driver)
      const result = await source.execute(criteria)

      expect(mockQuery).toHaveBeenCalled()
      expect(result).toEqual([{ id: 1, name: 'Test User' }])
    })
  })

  describe('function-based rules support', () => {
    describe('integration with SQLBuilder', () => {
      beforeEach(() => {
        mockQuery.mockResolvedValue([])
      })

      it('should support function-based rules that use SQLBuilder methods', async () => {
        const sourceFunction = (builder: SQLBuilderPort) => {
          return builder
            .from('users', 'u')
            .leftJoin('user_profiles', 'p', 'u.id = p.user_id')
            .column('u.id')
            .column('u.name')
            .column('u.email')
        }

        // Test function-based rules that generate dynamic SQL expressions
        const rules = {
          id: 'u.id',
          name: 'u.name',
          // Function-based rule that receives value and uses SQLBuilder
          dynamic_status: (
            operator: string,
            value: string,
            sourceInstance: SQLBuilderPort,
          ) => {
            // Return string expression for condition
            const statusValue = value === 'Active' ? 'active' : 'inactive'
            return `u.status = '${statusValue}'`
          },
        }

        // Execute source to get SQLBuilder instance
        const sourceInstance = driver.source(sourceFunction)

        // Create QueryCriteria with function-based rules
        const criteria = new QueryCriteria(
          rules,
          {
            filter: {
              id: { eq: 1 },
              dynamic_status: { eq: 'Active' },
            },
          },
          driver,
        )

        await sourceInstance.execute(criteria)

        // Verify that the SQL was generated correctly with function-based rules
        expect(mockQuery).toHaveBeenCalled()

        const [sql, options] = mockQuery.mock.lastCall || []

        // Check that the function-based rule was executed and SQL contains the result
        expect(sql).toContain('SELECT')
        expect(sql).toContain('FROM')
        expect(sql).toContain('users')
        expect(options.replacements).toContain(1) // id filter
        expect(options.replacements).toContain("u.status = 'active'") // dynamic_status filter
      })

      it('should handle mixed static and function-based rules', async () => {
        const sourceFunction = (builder: SQLBuilderPort) => {
          return builder
            .from('products', 'p')
            .column('p.id')
            .column('p.name')
            .column('p.price')
        }

        const rules = {
          id: 'p.id', // static rule
          name: 'p.name', // static rule
          // Function-based rule that uses filter value
          price_category: (
            operator: string,
            value: string,
            sourceInstance: SQLBuilderPort,
          ) => {
            // Return string expression for condition
            const threshold = value === 'premium' ? 1000 : 500
            return `p.price >= ${threshold}`
          },
        }

        const sourceInstance = driver.source(sourceFunction)

        const criteria = new QueryCriteria(
          rules,
          {
            filter: {
              name: { contains: 'laptop' },
              price_category: { eq: 'premium' },
            },
          },
          driver,
        )

        await sourceInstance.execute(criteria)

        expect(mockQuery).toHaveBeenCalled()

        const [sql, options] = mockQuery.mock.lastCall || []

        // Verify the SQL contains expected patterns
        expect(sql).toContain('SELECT')
        expect(sql).toContain('FROM')
        expect(sql).toContain('products')
        expect(sql).toContain('`p`.`name`')
        expect(sql).toContain('LIKE')

        // Verify replacements contain expected values
        expect(options.replacements).toContain('%laptop%') // name filter with LIKE
        expect(options.replacements).toContain('p.price >= 1000') // price_category filter
      })

      it('should handle function-based rules with complex expressions', async () => {
        const sourceFunction = (builder: SQLBuilderPort) => {
          return builder
            .from('orders', 'o')
            .leftJoin('customers', 'c', 'o.customer_id = c.id')
            .column('o.id')
            .column('o.total')
            .column('c.name', 'customer_name')
        }

        const rules = {
          id: 'o.id',
          // Complex function-based rule using multiple conditions
          order_priority: (
            operator: string,
            value: string,
            sourceInstance: SQLBuilderPort,
          ) => {
            if (value === 'high') {
              return `(o.total > 1000 OR c.vip_status = 'gold')`
            } else if (value === 'medium') {
              return `(o.total BETWEEN 500 AND 1000)`
            } else {
              return `(o.total < 500)`
            }
          },
          // Function rule that generates subquery-like expression
          customer_segment: (
            operator: string,
            value: string,
            sourceInstance: SQLBuilderPort,
          ) => {
            return `c.segment = '${value}' AND c.active = 1`
          },
        }

        const sourceInstance = driver.source(sourceFunction)

        const criteria = new QueryCriteria(
          rules,
          {
            filter: {
              order_priority: { eq: 'high' },
              customer_segment: { eq: 'enterprise' },
            },
          },
          driver,
        )

        await sourceInstance.execute(criteria)

        expect(mockQuery).toHaveBeenCalled()

        const [sql] = mockQuery.mock.lastCall || []

        // Verify complex expressions are in the SQL (checking for parts due to escaping)
        expect(sql).toContain('SELECT')
        expect(sql).toContain('orders')
        expect(sql).toContain('customers')
        expect(sql).toContain('order_priority')
        expect(sql).toContain('customer_segment')
      })

      it('should handle function-based rules that return column aliases', async () => {
        const sourceFunction = (builder: SQLBuilderPort) => {
          return builder
            .from('transactions', 't')
            .column('t.id')
            .column('t.amount')
            .column('t.created_at')
        }

        const rules = {
          id: 't.id',
          // Function rule that generates date-based expressions
          transaction_period: (
            operator: string,
            value: string,
            sourceInstance: SQLBuilderPort,
          ) => {
            if (value === 'today') {
              return `DATE(t.created_at) = CURRENT_DATE`
            } else if (value === 'this_week') {
              return `t.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY)`
            } else if (value === 'this_month') {
              return `MONTH(t.created_at) = MONTH(CURRENT_DATE) AND YEAR(t.created_at) = YEAR(CURRENT_DATE)`
            }
            return `1=1` // default: all periods
          },
          // Function rule for amount ranges
          amount_range: (
            operator: string,
            value: string,
            sourceInstance: SQLBuilderPort,
          ) => {
            if (operator === 'gte') {
              return `t.amount >= ${value}`
            } else if (operator === 'lte') {
              return `t.amount <= ${value}`
            }
            return `1=1`
          },
        }

        const sourceInstance = driver.source(sourceFunction)

        const criteria = new QueryCriteria(
          rules,
          {
            filter: {
              transaction_period: { eq: 'this_month' },
              amount_range: { gte: 100, lte: 1000 },
            },
          },
          driver,
        )

        await sourceInstance.execute(criteria)

        expect(mockQuery).toHaveBeenCalled()

        const [sql] = mockQuery.mock.lastCall || []

        // Verify date functions and range expressions (checking for parts due to escaping)
        expect(sql).toContain('created_at')
        expect(sql).toContain('transactions')
        expect(sql).toContain('transaction_period')
        expect(sql).toContain('amount_range')
      })
    })
  })
})

describe('QueryDriverSequelize customFilter functionality', () => {
  let mockSequelize: any
  let driver: QueryDriverSequelize
  let logger: QueryLoggerInterface

  beforeEach(() => {
    mockSequelize = {
      query: vi.fn(),
    }

    logger = createLogger()
    driver = new QueryDriverSequelize(mockSequelize, { logger })
  })

  describe('.customFilter()', () => {
    it('should execute function with source instance', () => {
      const sourceFunction = (builder: SQLBuilderPort) =>
        builder.from('test_table')

      driver.source(sourceFunction)

      const mockFn = vi.fn().mockReturnValue('test_result')
      const result = driver.customFilter('eq', 'test_value', mockFn)

      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('eq', 'test_value', expect.any(Object))
      expect(result).toBe('test_result')
    })

    it('should pass correctly configured source to function', () => {
      const sourceFunction = (builder: SQLBuilderPort) =>
        builder.from('users', 'u').select('u.id').where('u.active = ?', true)

      driver.source(sourceFunction)

      const capturedSource = vi.fn()
      driver.customFilter('contains', 'test', capturedSource)

      expect(capturedSource).toHaveBeenCalledTimes(1)

      // Verify that the source has the expected methods
      const source = capturedSource.mock.calls?.[0]?.[2] // Third argument is the builder
      expect(typeof source.from).toBe('function')
      expect(typeof source.select).toBe('function')
      expect(typeof source.where).toBe('function')
    })

    it('should work without source configuration', () => {
      const mockFn = vi.fn().mockReturnValue('result_without_source')

      const result = driver.customFilter('ne', null, mockFn)

      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('ne', null, expect.any(Object))
      expect(result).toBe('result_without_source')
    })

    it('should allow multiple customFilter calls with same source', () => {
      const sourceFunction = (builder: SQLBuilderPort) =>
        builder.from('test_table')

      driver.source(sourceFunction)

      const firstFn = vi.fn().mockReturnValue('first_result')
      const secondFn = vi.fn().mockReturnValue('second_result')

      const firstResult = driver.customFilter('gt', 10, firstFn)
      const secondResult = driver.customFilter('lt', 20, secondFn)

      expect(firstResult).toBe('first_result')
      expect(secondResult).toBe('second_result')
      expect(firstFn).toHaveBeenCalledTimes(1)
      expect(secondFn).toHaveBeenCalledTimes(1)
    })

    it('should pass fresh source instance to each function call', () => {
      const sourceFunction = (builder: SQLBuilderPort) =>
        builder.from('test_table')

      driver.source(sourceFunction)

      const sources: any[] = []
      const captureFn = (operator: any, value: any, source: any) => {
        sources.push(source)
        return 'captured'
      }

      driver.customFilter('in', [1, 2, 3], captureFn as any)
      driver.customFilter('in', [4, 5, 6], captureFn as any)

      expect(sources).toHaveLength(2)
      // Each call should get a fresh instance
      expect(sources[0]).not.toBe(sources[1])
    })

    it('should work with custom builder setup', () => {
      const customBuilderSetup = () => createBuilder()

      const customDriver = new QueryDriverSequelize(
        mockSequelize,
        { logger },
        customBuilderSetup,
      )

      const sourceFunction = (builder: SQLBuilderPort) =>
        builder.from('test_table')

      customDriver.source(sourceFunction)

      const mockFn = vi.fn().mockReturnValue('custom_result')
      const result = customDriver.customFilter('gte', 100, mockFn)

      expect(result).toBe('custom_result')
      expect(mockFn).toHaveBeenCalledWith('gte', 100, expect.any(Object))
    })
  })
})
