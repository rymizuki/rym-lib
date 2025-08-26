import { expect } from 'vitest'

import {
  QueryCriteria,
  QueryDriverInterface,
  QueryRunnerCriteria,
} from '@rym-lib/query-module'

import prisma from '../test-utils/prisma'
import { prismaMock } from '../test-utils/prisma-mock'

export async function expectQuery<
  Data,
  Criteria extends QueryRunnerCriteria<Data> = QueryRunnerCriteria<Data>,
>(driver: QueryDriverInterface, criteria: Criteria, expected: any[]) {
  await driver.execute(new QueryCriteria({}, criteria))

  return expect(prismaMock.$queryRawUnsafe.mock.lastCall).toStrictEqual(
    expected,
  )
}
