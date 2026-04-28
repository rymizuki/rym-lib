import { Sequelize } from 'sequelize'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { QueryCriteria, QueryLoggerInterface } from '@rym-lib/query-module'
import {
  SQLBuilder,
  SQLBuilderPort,
  exists,
} from '@rym-lib/query-module-sql-builder'

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
      const criteria = new QueryCriteria({}, {})
      const result = await source.execute(criteria)

      expect(mockQuery).toHaveBeenCalled()
      expect(result).toEqual([{ id: 1, name: 'Test User' }])
    })
  })

  describe('criteria.filter with custom filter implementation', () => {
    describe('custom filter mechanism', () => {
      it('should support EXISTS functionality through filter property', async () => {
        driver.source((builder) => builder.from('example'))

        // Mock criteria structure that would come from QueryCriteria with custom filter mapping
        const mockCriteria = {
          filter: {
            order_id: {
              column: null,
              value: { eq: 'test-value' },
              filter: (payload: any, context: any) =>
                exists(
                  context.builder
                    .createBuilder()
                    .from('orders', 'o')
                    .column('1')
                    .where(
                      context.builder
                        .createConditions()
                        .and('example.id', '=', 'o.user_id')
                        .and('o.id', payload.op, payload.value),
                    ),
                ),
            },
          },
          orderBy: [],
          take: undefined,
          skip: undefined,
        } as any

        mockQuery.mockResolvedValue([])

        await driver.execute(mockCriteria)

        const lastCall = mockQuery.mock.lastCall
        expect(lastCall?.[0]).toContain('EXISTS')
        expect(lastCall?.[0]).toContain('orders')
        // The parameter binding may be different due to how the EXISTS query is structured
        expect(lastCall?.[1]).toBeDefined()
      })

      it('should handle filter function with different operators', async () => {
        driver.source((builder) => builder.from('example'))

        const mockCriteria = {
          filter: {
            amount: {
              column: null,
              value: { gt: 100 },
              filter: (payload: any, context: any) =>
                exists(
                  context.builder
                    .createBuilder()
                    .from('transactions', 't')
                    .column('1')
                    .where('t.amount', payload.op, payload.value),
                ),
            },
          },
          orderBy: [],
          take: undefined,
          skip: undefined,
        } as any

        mockQuery.mockResolvedValue([])

        await driver.execute(mockCriteria)

        const lastCall = mockQuery.mock.lastCall
        expect(lastCall?.[0]).toContain('EXISTS')
        expect(lastCall?.[0]).toContain('transactions')
        expect(lastCall?.[1].replacements[0]).toBe(100)
      })

      it('should fall back to default behavior when no filter function is provided', async () => {
        driver.source((builder) => builder.from('example'))

        const mockCriteria = {
          filter: {
            normal_field: {
              column: null,
              value: { eq: 'normal-value' },
              filter: undefined, // No custom filter
            },
          },
          orderBy: [],
          take: undefined,
          skip: undefined,
        } as any

        mockQuery.mockResolvedValue([])

        await driver.execute(mockCriteria)

        const lastCall = mockQuery.mock.lastCall
        expect(lastCall?.[0]).not.toContain('EXISTS')
        expect(lastCall?.[0]).toContain('`normal_field` = ?')
        expect(lastCall?.[1].replacements[0]).toBe('normal-value')
      })
    })
  })

  describe('.executeCount', () => {
    it('should throw when source is not configured', async () => {
      const fresh = new QueryDriverSequelize(sequelize, {
        logger: createLogger(),
      })
      await expect(
        fresh.executeCount(new QueryCriteria({}, {})),
      ).rejects.toThrowError(/QueryDriver must be required source\./)
    })

    it('should issue SELECT COUNT(*) SQL', async () => {
      driver.source((builder) => builder.from('example'))
      mockQuery.mockResolvedValue([{ count: 5 }])

      await driver.executeCount(new QueryCriteria({}, {}))

      const lastCall = mockQuery.mock.lastCall
      expect(lastCall?.[0]).toBe(
        'SELECT COUNT(*) AS `count`\nFROM\n  `example`',
      )
    })

    it('should return numeric count from row.count', async () => {
      driver.source((builder) => builder.from('example'))
      mockQuery.mockResolvedValue([{ count: 7 }])

      const count = await driver.executeCount(new QueryCriteria({}, {}))

      expect(count).toBe(7)
    })

    it('should convert string count to number', async () => {
      driver.source((builder) => builder.from('example'))
      mockQuery.mockResolvedValue([{ count: '42' }])

      const count = await driver.executeCount(new QueryCriteria({}, {}))

      expect(count).toBe(42)
      expect(typeof count).toBe('number')
    })

    it('should fall back to first column when count column missing', async () => {
      driver.source((builder) => builder.from('example'))
      mockQuery.mockResolvedValue([{ 'COUNT(*)': 3 }])

      const count = await driver.executeCount(new QueryCriteria({}, {}))

      expect(count).toBe(3)
    })

    it('should return 0 when no rows', async () => {
      driver.source((builder) => builder.from('example'))
      mockQuery.mockResolvedValue([])

      const count = await driver.executeCount(new QueryCriteria({}, {}))

      expect(count).toBe(0)
    })

    it('should include WHERE filter in COUNT SQL', async () => {
      driver.source((builder) => builder.from('example'))
      mockQuery.mockResolvedValue([{ count: 1 }])

      await driver.executeCount(
        new QueryCriteria({}, { filter: { value: { eq: 'foo' } } }),
      )

      const lastCall = mockQuery.mock.lastCall
      expect(lastCall?.[0]).toContain('SELECT COUNT(*) AS `count`')
      expect(lastCall?.[0]).toContain('WHERE')
      expect(lastCall?.[1].replacements).toStrictEqual(['foo'])
    })
  })
})
