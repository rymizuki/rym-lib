import { describe, it, expect } from 'vitest'
import { QueryDriverSequelize } from './driver'
import { Sequelize } from 'sequelize'
import { createLogger } from '@rym-lib/query-module/test-utils'

describe('QueryDriverSequelize - error handling', () => {
  it('should throw when execute called without source', async () => {
    const sequelize = new Sequelize('sqlite::memory:')
    const driver = new QueryDriverSequelize(sequelize, { logger: createLogger() })
    await expect(async () => await driver.execute({} as any)).rejects.toThrow()
  })
})

