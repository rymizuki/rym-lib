import { unescape } from 'coral-sql'

import { PrismaClient } from '@prisma/client'
import {
  defineQuery,
  QueryLoggerInterface,
  QuerySpecification,
} from '@rym-lib/query-module'
import { QueryDriverPrisma } from '@rym-lib/query-module-driver-prisma'

type Data = {
  id: string
  name: string
  birthdate: string
  status: 'active' | 'inactive'
}

const prisma = new PrismaClient()

const logger: QueryLoggerInterface = {
  verbose(message: string) {},
  info(message, payload) {},
  error(message, error) {},
}

const driver = new QueryDriverPrisma(prisma, { logger })

const spec: QuerySpecification<Data, QueryDriverPrisma> = {
  source: (builder) => {
    return builder
      .from('user', 'u')
      .leftJoin('user_inactivation', 'ui', 'u.id = ui.user_id')
      .column('u.id')
      .column('name')
      .column('u.birthdate')
      .column(
        unescape(`
          CASE WHEN ui.id IS NOT NULL
            THEN 'active'
            ELSE 'inactive'
          END
          `),
      )
  },
  rules: {},
}

const query = defineQuery(driver, spec)
