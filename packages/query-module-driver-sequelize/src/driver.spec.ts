import { Sequelize } from 'sequelize'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { QueryCriteria, QueryLoggerInterface } from '@rym-lib/query-module'
import {
  SQLBuilder,
  SQLBuilderPort,
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
      const criteria = new QueryCriteria({}, {}, driver)
      const result = await source.execute(criteria)

      expect(mockQuery).toHaveBeenCalled()
      expect(result).toEqual([{ id: 1, name: 'Test User' }])
    })
  })

})

