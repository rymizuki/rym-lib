import { Sequelize } from 'sequelize'
import { describe, it, expect, vi } from 'vitest'

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

describe('QueryDriverSequelize - error handling', () => {
  it('should throw when execute called without source', async () => {
    const sequelize = new Sequelize('sqlite::memory:')
    const driver = new QueryDriverSequelize(sequelize, {
      logger: createLogger(),
    })
    await expect(async () => await driver.execute({} as any)).rejects.toThrow()
  })
})
