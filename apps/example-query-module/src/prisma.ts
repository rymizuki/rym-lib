import {
  caseWhen,
  exists,
  is_not_null,
  json_array_aggregate,
  json_object,
  unescape,
} from 'coral-sql'

import {
  defineQuery,
  QueryLoggerInterface,
  QueryResultList,
  QueryRunnerCriteria,
  QuerySpecification,
} from '@rym-lib/query-module'
import { QueryDriverPrisma } from '@rym-lib/query-module-driver-prisma'

import { PrismaClient } from '../generated/prisma/client.js'

type Data = {
  id: string
  name: string
  birthdate: string
  status: 'active' | 'inactive'
  orders: {
    id: string
    ordered_at: Date
  }[]
}

type List = QueryResultList<Data>
type Params = QueryRunnerCriteria<
  Data,
  {
    order_id: string
  }
>

const prisma = new PrismaClient().$extends({
  query: {
    $queryRawUnsafe: async ({ args }) => {
      const sql = args.shift()
      console.debug(
        '[Query]',
        sql.replace(/\n/g, ' ').replace(/(\s|\t)+/g, ' '),
        args,
      )

      return [
        {
          id: '123456',
          name: 'april',
          birthdate: '1999-01-01',
          status: 'active',
        },
      ]
    },
  },
})

const logger: QueryLoggerInterface = {
  verbose(message: string) {},
  info(message, payload) {},
  error(message, error) {},
}

const driver = new QueryDriverPrisma(prisma, { logger })

const spec: QuerySpecification<Data, QueryDriverPrisma, List, Params> = {
  source: (builder) => {
    return builder
      .from('user', 'u')
      .leftJoin('user_inactivation', 'ui', 'u.id = ui.user_id')
      .column('u.id')
      .column('u.name')
      .column('u.birthdate')
      .column(
        caseWhen().when('ui.id', is_not_null()).then('active').else('inactive'),
        'status',
      )
      .column(
        builder
          .createBuilder()
          .from('order', 'o')
          .column(
            json_array_aggregate(
              json_object({ id: 'o.id', ordered_at: 'o.created_at' }),
            ),
          )
          .where('order.user_id', unescape('u.id'))
          .orderBy('o.created_at', 'desc')
          .limit(5),
        'orders',
      )
  },
  rules: {
    id: 'u.id',
    name: 'u.name',
    status: {
      column: () =>
        caseWhen().when('ui.id', is_not_null()).then('active').else('inactive'),
    },
    order_id: {
      filter: ({ op, value }, { builder }) =>
        exists(
          builder
            .createBuilder()
            .from('order', 'o')
            .column(unescape('1'))
            .where(
              builder
                .createConditions()
                .and('u.id', unescape('o.user_id'))
                .and('o.id', op, value),
            ),
        ),
    },
  },
}

const main = async () => {
  const query = defineQuery<Data, QueryDriverPrisma, List, Params>(driver, spec)

  console.info('params: undefined', await query.many())

  console.info('params: orderBy', await query.many({ orderBy: 'id:desc' }))
  console.info('params: take, skip', await query.many({ take: 10, skip: 20 }))
  console.info(
    'params: filter',
    await query.many({
      filter: { birthdate: { gte: '2000-01-01', lt: '2020-12-31' } },
    }),
  )
  console.info(
    'params: filter[]',
    await query.many({
      filter: [
        { name: { contains: 'jr.' } },
        { birthdate: { gte: '2000-01-01', lt: '2020-12-31' } },
      ],
    }),
  )
  console.info(
    'params: filter for case-when',
    await query.many({ filter: { status: { eq: 'active' } } }),
  )
  console.info(
    'params: filter for exists',
    await query.many({ filter: { order_id: { eq: '1234' } } }),
  )
}

main()
