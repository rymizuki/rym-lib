import { createBuilder, createConditions, SQLBuilderPort } from 'coral-sql'
import { QueryTypes, Sequelize } from 'sequelize'

import {
  QueryDriverInterface,
  QueryCriteriaInterface,
  QueryLoggerInterface,
} from '@rym-lib/query-module'

export class QueryDriverSequelize implements QueryDriverInterface {
  private setup: ((builder: SQLBuilderPort) => SQLBuilderPort) | null = null

  constructor(
    private db: Sequelize,
    private context: {
      logger: QueryLoggerInterface
    },
  ) {}

  source(setup: (builder: SQLBuilderPort) => SQLBuilderPort): this {
    this.setup = setup
    return this
  }

  async execute(
    criteria: QueryCriteriaInterface,
  ): Promise<Record<string, any>[]> {
    if (!this.setup) {
      throw new Error('QueryDriver must be required source.')
    }
    const builder = this.buildCondition(this.setup(createBuilder()), criteria)

    const [sql, replacements] = builder.toSQL()
    this.context.logger.verbose(`[QueryDriverSequelize] ${sql}`, {
      sql,
      replacements,
    })

    const rows = await this.db.query(sql, {
      replacements,
      type: QueryTypes.SELECT,
    })
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
            // name = value
            cond.and(name, value)
            break
          }
          case 'ne': {
            // name != value
            cond.and(name, '!=', value)
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
