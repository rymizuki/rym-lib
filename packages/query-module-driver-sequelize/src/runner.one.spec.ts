import { Sequelize } from 'sequelize'
import { describe, it, expect, beforeEach, vi } from 'vitest'

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

describe('QueryDriverSequelize - basic one/many semantics', () => {
  let sequelize: Sequelize
  let mockQuery: any
  let driver: QueryDriverSequelize
  const data = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    sequelize = new Sequelize('sqlite::memory:')
    mockQuery = vi.fn()
    ;(sequelize as any).query = mockQuery
    driver = new QueryDriverSequelize(sequelize, { logger: createLogger() })
    driver.source((b: any) => b.from('example'))
  })

  it('many should return rows', async () => {
    mockQuery.mockResolvedValue(Promise.resolve(data) as any)
    const res = await driver.execute(new QueryCriteria({}, {}))
    expect(res).toStrictEqual(data)
  })

  it('one should return first row or null', async () => {
    mockQuery.mockResolvedValue(Promise.resolve(data) as any)
    const rows = await driver.execute(new QueryCriteria({}, {}))
    expect(rows[0]).toStrictEqual(data[0])
  })
})
