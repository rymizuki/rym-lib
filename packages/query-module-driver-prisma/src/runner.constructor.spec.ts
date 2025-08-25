import { describe, it, expect } from 'vitest'
import { QueryDriverPrisma } from './'
import prisma from './test-utils/prisma'
import { createLogger } from '@rym-lib/query-module/test-utils'

describe('QueryDriverPrisma - Constructor', () => {
  it('should create instance when valid params provided', () => {
    const driver = new QueryDriverPrisma(prisma, { logger: createLogger() })
    expect(driver).toBeDefined()
  })

  it('should throw when invalid params provided', () => {
    expect(() => new QueryDriverPrisma(null as any, { logger: createLogger() } as any)).toThrow()
  })
})

