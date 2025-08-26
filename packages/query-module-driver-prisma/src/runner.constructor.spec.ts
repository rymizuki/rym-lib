import { QueryDriverPrisma } from './'

import { describe, it, expect } from 'vitest'

import { createLogger } from '@rym-lib/query-module/test-utils'

import prisma from './test-utils/prisma'

describe('QueryDriverPrisma - Constructor', () => {
  it('should create instance when valid params provided', () => {
    const driver = new QueryDriverPrisma(prisma, { logger: createLogger() })
    expect(driver).toBeDefined()
  })

  it('should allow construction with invalid params but fail on execution', async () => {
    const driver = new QueryDriverPrisma(
      null as any,
      { logger: createLogger() } as any,
    )
    expect(driver).toBeDefined()

    // set a source so execute proceeds to use the DB instance (which is null)
    driver.source((b: any) => b.from('example'))

    await expect(async () => await driver.execute({} as any)).rejects.toThrow()
  })
})
