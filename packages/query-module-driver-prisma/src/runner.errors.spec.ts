import { QueryDriverPrisma } from './'

import { describe, it, beforeEach, expect } from 'vitest'

import { createLogger } from '@rym-lib/query-module/test-utils'

import prisma from './test-utils/prisma'

describe('QueryDriverPrisma - error handling', () => {
  it('should throw when execute called without source', async () => {
    const driver = new QueryDriverPrisma(prisma, { logger: createLogger() })
    await expect(async () => await driver.execute({} as any)).rejects.toThrow()
  })
})
