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

describe('QueryDriverSequelize - Constructor', () => {
  it('should create instance when valid params provided', () => {
    const sequelize = new Sequelize('sqlite::memory:')
    const driver = new QueryDriverSequelize(sequelize, {
      logger: createLogger(),
    })
    expect(driver).toBeDefined()
  })

  it('should allow construction with invalid params but fail on execution', async () => {
    const driver = new QueryDriverSequelize(
      null as any,
      { logger: createLogger() } as any,
    )
    expect(driver).toBeDefined()

    driver.source((b: any) => b.from('example'))

    await expect(async () => await driver.execute({} as any)).rejects.toThrow()
  })
})
