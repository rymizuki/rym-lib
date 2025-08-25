import { describe, it, expect } from 'vitest'
import { QueryDriverSequelize } from './driver'
import { Sequelize } from 'sequelize'
import { createLogger } from '@rym-lib/query-module/test-utils'

describe('QueryDriverSequelize - Constructor', () => {
  it('should create instance when valid params provided', () => {
    const sequelize = new Sequelize('sqlite::memory:')
    const driver = new QueryDriverSequelize(sequelize, { logger: createLogger() })
    expect(driver).toBeDefined()
  })

  it('should allow construction with invalid params but fail on execution', async () => {
    const driver = new QueryDriverSequelize(null as any, { logger: createLogger() } as any)
    expect(driver).toBeDefined()

    driver.source((b: any) => b.from('example'))

    await expect(async () => await driver.execute({} as any)).rejects.toThrow()
  })
})

