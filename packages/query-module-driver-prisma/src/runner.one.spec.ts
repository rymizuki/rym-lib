import { QueryDriverPrisma } from './'

import { describe, it, expect, beforeEach } from 'vitest'

import { QueryCriteria } from '@rym-lib/query-module'
import { createLogger } from '@rym-lib/query-module/test-utils'

import prisma from './test-utils/prisma'
import { prismaMock } from './test-utils/prisma-mock'

describe('QueryDriverPrisma - basic one/many semantics', () => {
  let driver: any
  const data = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ]

  beforeEach(() => {
    driver = new QueryDriverPrisma(prisma, { logger: createLogger() })
    prismaMock.$queryRawUnsafe.mockReturnValue(Promise.resolve(data) as any)
    driver.source((b: any) => b.from('example'))
  })

  it('many should return rows', async () => {
    const res = await driver.execute(new QueryCriteria({}, {}))
    expect(res).toStrictEqual(data)
  })

  it('one should return first row or null', async () => {
    const rows = await driver.execute(new QueryCriteria({}, {}))
    expect(rows[0]).toStrictEqual(data[0])
  })
})
