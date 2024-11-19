import {
  createBuilder,
  createConditions,
  is_not_null,
  is_null,
  SQLBuilderPort,
} from 'coral-sql'

import { PrismaClient } from '@prisma/client'
import {
  QueryCriteriaInterface,
  QueryDriverInterface,
  QueryLoggerInterface,
} from '@rym-lib/query-module'

export class QueryDriverPrisma implements QueryDriverInterface {
  private setup: ((builder: SQLBuilderPort) => SQLBuilderPort) | null = null

  constructor(
    private db: PrismaClient,
    private context: {
      logger: QueryLoggerInterface
    },
  ) {}

  source(setup: (builder: SQLBuilderPort) => SQLBuilderPort): this {
    this.setup = setup
    return this
  }

  async execute<D>(criteria: QueryCriteriaInterface<D>): Promise<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Record<string, any>[]
  > {
    if (!this.setup) {
      throw new Error('QueryDriver must be required source.')
    }

    const builder = this.buildCondition(this.setup(createBuilder()), criteria)
    const [sql, replacements] = builder.toSQL()
    this.context.logger.verbose(`[QueryDriverPrisma] ${sql}`, { replacements })

    const rows = await this.db.$queryRawUnsafe(sql, ...replacements)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return rows as Record<string, any>[]
  }

  private buildCondition(
    builder: SQLBuilderPort,
    criteria: QueryCriteriaInterface,
  ) {
    const cond = createConditions()

    // filter -> where
    for (const name of keys(criteria.filter)) {
      if (typeof name !== 'string') continue

      const property = criteria.filter[name]
      if (!property) continue

      for (const operator of keys(property)) {
        const value = property[operator]
        switch (operator) {
          case 'eq': {
            if (value === null) {
              // name IS NULL
              cond.and(name, is_null())
            } else {
              // name = value
              cond.and(name, value)
            }
            break
          }
          case 'ne': {
            if (value === null) {
              // name IS NOT NULL
              cond.and(name, is_not_null())
            } else {
              // name != value
              cond.and(name, '!=', value)
            }
            break
          }
          case 'lt': {
            // name < value
            cond.and(name, '<', value)
            break
          }
          case 'lte': {
            // name <= value
            cond.and(name, '<=', value)
            break
          }
          case 'gt': {
            // name > value
            cond.and(name, '>', value)
            break
          }
          case 'gte': {
            // name >= value
            cond.and(name, '>=', value)
            break
          }
          case 'contains': {
            if (value) {
              // name LIKE `%${value}%`
              cond.and(name, 'like', `%${value}%`)
            }
            break
          }
          case 'not_contains': {
            if (value) {
              // name NOT LIKE `%${value}%`
              cond.and(name, 'not like', `%${value}%`)
            }
            break
          }
          case 'in': {
            // name IN value
            cond.and(name, 'in', value)
            break
          }
        }
      }
    }
    builder.where(cond)

    // orderBy
    if (criteria.orderBy) {
      const { orderBy } = criteria
      const orders = Array.isArray(orderBy) ? orderBy : [orderBy]
      for (const order of orders) {
        const [name, direction] = (order as string).split(':')
        if (!name) continue
        builder.orderBy(
          name,
          (direction as 'asc' | 'desc' | undefined) ?? 'asc',
        )
      }
    }

    // take -> limit
    if (criteria.take) {
      builder.limit(criteria.take)
    }

    // skip -> offset
    if (criteria.skip) {
      builder.offset(criteria.skip)
    }

    return builder
  }
}

function keys<T extends Record<string, unknown>>(value: T) {
  return Object.keys(value) as (keyof T)[]
}
