import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Sequelize } from 'sequelize'
import { QueryDriverSequelize } from './driver'
import { QueryCriteria } from '@rym-lib/query-module'
import { SQLBuilder } from '@rym-lib/query-module-sql-builder'

// Create a mock logger
const createLogger = () => ({
  verbose: vi.fn(),
  info: vi.fn(),
  error: vi.fn()
})

// Mock Sequelize
vi.mock('sequelize', () => {
  const mockQuery = vi.fn()
  return {
    Sequelize: vi.fn().mockImplementation(() => ({
      query: mockQuery
    })),
    QueryTypes: {
      SELECT: 'SELECT'
    }
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
      const sourceFunction = (builder: SQLBuilder) => {
        return builder.from('users')
      }

      mockQuery.mockResolvedValue([{ id: 1, name: 'Test User' }])

      const source = driver.source(sourceFunction)
      const criteria = new QueryCriteria({}, {})
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
        const sourceFunction = (builder: SQLBuilder) => {
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
          dynamic_status: (value, sourceInstance: SQLBuilder) => {
            // Use the filter value to generate different SQL expressions
            const targetValue = value.eq
            return `CASE WHEN u.status = '${targetValue === 'Active' ? 'active' : 'inactive'}' THEN '${targetValue}' ELSE 'Unknown' END`
          }
        }

        // Execute source to get SQLBuilder instance
        const sourceInstance = driver.source(sourceFunction)

        // Create QueryCriteria with function-based rules
        const criteria = new QueryCriteria(
          rules,
          {
            filter: {
              id: { eq: 1 },
              dynamic_status: { eq: 'Active' }
            }
          },
          sourceInstance
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
        expect(options.replacements).toContain('Active') // dynamic_status filter
      })

      it('should handle mixed static and function-based rules', async () => {
        const sourceFunction = (builder: SQLBuilder) => {
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
          price_category: (value, sourceInstance: SQLBuilder) => {
            // Generate different SQL based on the filter value
            const threshold = value.eq === 'premium' ? 1000 : 500
            return `CASE WHEN p.price >= ${threshold} THEN '${value.eq}' ELSE 'standard' END`
          }
        }

        const sourceInstance = driver.source(sourceFunction)

        const criteria = new QueryCriteria(
          rules,
          {
            filter: {
              name: { contains: 'laptop' },
              price_category: { eq: 'premium' }
            }
          },
          sourceInstance
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
        expect(options.replacements).toContain('premium') // price_category filter
      })

      it('should handle function-based rules with complex expressions', async () => {
        const sourceFunction = (builder: SQLBuilder) => {
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
          order_priority: (value, sourceInstance: SQLBuilder) => {
            if (value.eq === 'high') {
              return `(o.total > 1000 OR c.vip_status = 'gold')`
            } else if (value.eq === 'medium') {
              return `(o.total BETWEEN 500 AND 1000)`
            } else {
              return `(o.total < 500)`
            }
          },
          // Function rule that generates subquery-like expression
          customer_segment: (value, sourceInstance: SQLBuilder) => {
            const segment = value.eq
            return `c.segment = '${segment}' AND c.active = 1`
          }
        }

        const sourceInstance = driver.source(sourceFunction)

        const criteria = new QueryCriteria(
          rules,
          {
            filter: {
              order_priority: { eq: 'high' },
              customer_segment: { eq: 'enterprise' }
            }
          },
          sourceInstance
        )

        await sourceInstance.execute(criteria)

        expect(mockQuery).toHaveBeenCalled()

        const [sql] = mockQuery.mock.lastCall || []

        // Verify complex expressions are in the SQL (checking for parts due to escaping)
        expect(sql).toContain('total > 1000')
        expect(sql).toContain('vip_status')
        expect(sql).toContain('segment')
        expect(sql).toContain('active = 1')
      })

      it('should handle function-based rules that return column aliases', async () => {
        const sourceFunction = (builder: SQLBuilder) => {
          return builder
            .from('transactions', 't')
            .column('t.id')
            .column('t.amount')
            .column('t.created_at')
        }

        const rules = {
          id: 't.id',
          // Function rule that generates date-based expressions
          transaction_period: (value, sourceInstance: SQLBuilder) => {
            const period = value.eq
            if (period === 'today') {
              return `DATE(t.created_at) = CURRENT_DATE`
            } else if (period === 'this_week') {
              return `t.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY)`
            } else if (period === 'this_month') {
              return `MONTH(t.created_at) = MONTH(CURRENT_DATE) AND YEAR(t.created_at) = YEAR(CURRENT_DATE)`
            }
            return `1=1` // default: all periods
          },
          // Function rule for amount ranges
          amount_range: (value, sourceInstance: SQLBuilder) => {
            if (value.gte && value.lte) {
              return `t.amount BETWEEN ${value.gte} AND ${value.lte}`
            } else if (value.gte) {
              return `t.amount >= ${value.gte}`
            } else if (value.lte) {
              return `t.amount <= ${value.lte}`
            }
            return `1=1`
          }
        }

        const sourceInstance = driver.source(sourceFunction)

        const criteria = new QueryCriteria(
          rules,
          {
            filter: {
              transaction_period: { eq: 'this_month' },
              amount_range: { gte: 100, lte: 1000 }
            }
          },
          sourceInstance
        )

        await sourceInstance.execute(criteria)

        expect(mockQuery).toHaveBeenCalled()

        const [sql] = mockQuery.mock.lastCall || []

        // Verify date functions and range expressions (checking for parts due to escaping)
        expect(sql).toContain('created_at')
        expect(sql).toContain('MONTH')
        expect(sql).toContain('YEAR')
        expect(sql).toContain('amount BETWEEN')
      })
    })
  })
})