import { Sequelize } from 'sequelize'
import { describe, it, beforeEach, expect, vi } from 'vitest'

import { QueryCriteria } from '@rym-lib/query-module'
import { createLogger } from '@rym-lib/query-module/test-utils'

import { QueryDriverSequelize } from './driver'

// mock sequelize to avoid sqlite3 requirement in test env
vi.mock('sequelize', () => {
  const mockQuery = vi.fn()
  return {
    Sequelize: vi.fn().mockImplementation(() => ({ query: mockQuery })),
    QueryTypes: { SELECT: 'SELECT' },
  }
})

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
    await driver.execute(new QueryCriteria({}, {}))
    expect(mockQuery.mock.lastCall).toStrictEqual([
      'SELECT\n  *\nFROM\n  `example`',
      { replacements: [], type: 'SELECT' },
    ])
  })

  it('filter eq -> where equals', async () => {
    mockQuery.mockResolvedValue([])
    await driver.execute(
      new QueryCriteria({}, { filter: { value: { eq: 'example' } } }),
    )
    expect(mockQuery.mock.lastCall).toStrictEqual([
      'SELECT\n  *\nFROM\n  `example`\nWHERE\n  (((`value` = ?)))',
      { replacements: ['example'], type: 'SELECT' },
    ])
  })

  it('orderBy -> order clause', async () => {
    mockQuery.mockResolvedValue([])
    await driver.execute(
      new QueryCriteria({}, { orderBy: 'index:desc' } as any),
    )
    expect(mockQuery.mock.lastCall).toStrictEqual([
      'SELECT\n  *\nFROM\n  `example`\nORDER BY\n  `index` DESC',
      { replacements: [], type: 'SELECT' },
    ])
  })
})
