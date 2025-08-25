import { describe, it, beforeEach, expect } from 'vitest'
import { QueryDriverPrisma } from './'
import prisma from './test-utils/prisma'
import { prismaMock } from './test-utils/prisma-mock'
import { createLogger } from '@rym-lib/query-module/test-utils'
import { expectQuery } from './test-utils/assertions'

describe('QueryDriverPrisma - SQL generation', () => {
  let driver: any
  beforeEach(() => {
    driver = new QueryDriverPrisma(prisma, { logger: createLogger() })
    driver.source((b: any) => b.from('example'))
    prismaMock.$queryRawUnsafe.mockClear()
  })

  it('no criteria -> select *', async () => {
    await expectQuery(driver, {}, [
      'SELECT\n  *\nFROM\n  `example`',
    ])
  })

  it('filter eq -> where equals', async () => {
    await expectQuery(driver, { filter: { value: { eq: 'example' } } }, [
      'SELECT\n  *\nFROM\n  `example`\nWHERE\n  (((`value` = ?)))',
      'example',
    ])
  })

  it('orderBy -> order clause', async () => {
    await expectQuery(driver, { orderBy: 'index:desc' } as any, [
      'SELECT\n  *\nFROM\n  `example`\nORDER BY\n  `index` DESC',
    ])
  })
})

