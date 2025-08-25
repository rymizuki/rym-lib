import { describe, it, beforeEach, expect, vi } from 'vitest'
// mock sequelize to avoid sqlite3 requirement in test env
vi.mock('sequelize', () => {
  const mockQuery = vi.fn()
  return {
    Sequelize: vi.fn().mockImplementation(() => ({ query: mockQuery })),
    QueryTypes: { SELECT: 'SELECT' },
  }
})
import { Sequelize } from 'sequelize'
import { QueryDriverSequelize } from './driver'
import { createLogger } from '@rym-lib/query-module/test-utils'
import { QueryCriteria } from '@rym-lib/query-module'

describe('QueryDriverSequelize - SQL generation', () => {
  let sequelize: Sequelize
  let mockQuery: any
  let driver: QueryDriverSequelize

  beforeEach(() => {
    vi.clearAllMocks()
    sequelize = new Sequelize('sqlite::memory:')
    mockQuery = vi.fn()
    ;(sequelize as any).query = mockQuery
    driver = new QueryDriverSequelize(sequelize, { logger: createLogger() })
    driver.source((b: any) => b.from('example'))
  })

  it('no criteria -> select *', async () => {
    mockQuery.mockResolvedValue([])
    await driver.execute(new QueryCriteria({}, {}, driver))
    expect(mockQuery.mock.lastCall).toStrictEqual([
      'SELECT\n  *\nFROM\n  `example`',
      { replacements: undefined, type: 'SELECT' },
    ])
  })

  it('filter eq -> where equals', async () => {
    mockQuery.mockResolvedValue([])
    await driver.execute(new QueryCriteria({}, { filter: { value: { eq: 'example' } } }, driver))
    expect(mockQuery.mock.lastCall).toStrictEqual([
      'SELECT\n  *\nFROM\n  `example`\nWHERE\n  (((`value` = ?)))',
      { replacements: ['example'], type: 'SELECT' },
    ])
  })

  it('orderBy -> order clause', async () => {
    mockQuery.mockResolvedValue([])
    await driver.execute(new QueryCriteria({}, { orderBy: 'index:desc' } as any, driver))
    expect(mockQuery.mock.lastCall).toStrictEqual([
      'SELECT\n  *\nFROM\n  `example`\nORDER BY\n  `index` DESC',
      { replacements: undefined, type: 'SELECT' },
    ])
  })
})
