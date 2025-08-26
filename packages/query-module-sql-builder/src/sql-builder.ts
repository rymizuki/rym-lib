import {
  createBuilder,
  createConditions,
  is_not_null,
  is_null,
  SQLBuilderConditionExpressionPort,
  SQLBuilderConditionsPort,
  SQLBuilderOperator,
  SQLBuilderPort,
} from 'coral-sql'

import type {
  CustomFilterFieldFunction,
  QueryCriteriaInterface,
  QueryDriverCustomFilterFunction,
  QueryDriverInterface,
  QueryFilter,
  QueryFilterOperator,
} from '@rym-lib/query-module'

export { createBuilder }

export type CustomFilterFunction = QueryDriverCustomFilterFunction<
  { op: SQLBuilderOperator; value: string | string[] },
  { builder: SQLBuilderPort },
  SQLBuilderPort | SQLBuilderConditionExpressionPort
>

type BuildSqlOptions = {
  containsSplitSpaces: boolean
  builder: SQLBuilderPort
  customFilter?: CustomFilterFunction
}

type FilterPayload = {
  value: QueryFilter<any>
  filter?: CustomFilterFieldFunction
}

function keys<T extends Record<string, unknown>>(value: T) {
  return Object.keys(value) as (keyof T)[]
}

const operatorMap: Record<QueryFilterOperator, SQLBuilderOperator> = {
  in: 'in',
  contains: 'like',
  not_contains: 'not like',
  eq: '=',
  ne: '<>',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
}

const defaults: BuildSqlOptions = {
  builder: createBuilder(),
  containsSplitSpaces: true,
}

export function buildSQL<Driver extends QueryDriverInterface>(
  builder: SQLBuilderPort,
  criteria: QueryCriteriaInterface,
  options: Partial<BuildSqlOptions> = {},
) {
  const o = { ...defaults, ...options }
  // Reverted: original behavior (without guard against undefined in criteria.filter)
  if (criteria.filter) {
    const whole = createConditions()
    for (const filter of Array.isArray(criteria.filter)
      ? criteria.filter
      : [criteria.filter]) {
      // null/undefined要素をスキップ
      if (!filter) continue

      const cond = createConditions()
      let hasCondition = false

      // filter -> where
      for (const name of keys(filter)) {
        if (typeof name !== 'string') continue
        if (/^having:/.test(name)) continue

        const property = filter[name]
        if (!property) continue

        const { value, filter: customFilter } = property as FilterPayload
        hasCondition = true

        const columnName = (() => {
          if (!property) return name
          if (typeof property !== 'object') return name
          if (!('column' in property)) return name
          if (!property.column) return name
          if (typeof property.column === 'string') return property.column
          return property.column() as SQLBuilderPort
        })()

        createCond(cond, columnName, { value, filter: customFilter }, o)
      }

      if (hasCondition) {
        whole.or(cond)
      }
    }
    builder.where(whole)

    // having support
    const whole_having = createConditions()
    for (const filter of Array.isArray(criteria.filter)
      ? criteria.filter
      : [criteria.filter]) {
      // null/undefined要素をスキップ
      if (!filter) continue

      const cond = createConditions()
      let hasHavingCondition = false

      // filter -> having
      for (const having_name of keys(filter)) {
        if (typeof having_name !== 'string') continue
        if (!/^having:/.test(having_name)) continue

        const property = filter[having_name]
        if (!property) continue

        const { value, filter: customFilter } = property as FilterPayload
        const name = having_name.replace(/^having:/, '')
        hasHavingCondition = true

        const columnName = (() => {
          if (!property) return name
          if (typeof property !== 'object') return name
          if (!('column' in property)) return name
          if (!property.column) return name
          if (typeof property.column === 'string') return property.column
          return property.column() as SQLBuilderPort
        })()

        createCond(cond, columnName, { value, filter: customFilter }, o)
      }

      if (hasHavingCondition) {
        whole_having.or(cond)
      }
    }
    builder.having(whole_having)
  }

  // orderBy
  if (criteria.orderBy) {
    const { orderBy } = criteria
    const orders = Array.isArray(orderBy) ? orderBy : [orderBy]
    for (const order of orders) {
      const [name, direction] = (order as string).split(':')
      if (!name) continue
      builder.orderBy(name, (direction as 'asc' | 'desc' | undefined) ?? 'asc')
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

  return builder.toSQL()
}

type FilterValue = {
  value:
    | string
    | string[]
    | null
    | ((
        op: SQLBuilderOperator,
        value: string | string[],
      ) => SQLBuilderPort | SQLBuilderConditionExpressionPort)
}
function createCond(
  cond: SQLBuilderConditionsPort,
  name: string | SQLBuilderPort,
  { value: property, filter }: FilterPayload,
  options: BuildSqlOptions,
) {
  const field = name
  // property がnull/undefinedの場合は処理をスキップ
  if (!property || property === null || property === undefined) return

  // property が object でない場合もスキップ
  if (typeof property !== 'object') return

  for (const operator of keys(property) as QueryFilterOperator[]) {
    const value = property[operator] as any // string | string[]

    if (filter && options.customFilter) {
      const op = operatorMap[operator]
      const builder = options.customFilter(
        { op, value },
        { builder: options.builder },
        filter,
      )
      if (!builder) continue

      cond.and(builder)
      continue
    }

    switch (operator) {
      case 'eq': {
        if (value === null) {
          // field IS NULL
          cond.and(field, is_null())
        } else {
          // field = value
          cond.and(field, value)
        }
        break
      }
      case 'ne': {
        if (value === null) {
          // field IS NOT NULL
          cond.and(field, is_not_null())
        } else {
          // field != value
          cond.and(field, '!=', value)
        }
        break
      }
      case 'lt': {
        // field < value
        cond.and(field, '<', value)
        break
      }
      case 'lte': {
        // field <= value
        cond.and(field, '<=', value)
        break
      }
      case 'gt': {
        // field > value
        cond.and(field, '>', value)
        break
      }
      case 'gte': {
        // field >= value
        cond.and(field, '>=', value)
        break
      }
      case 'contains': {
        if (!value) break
        if (Array.isArray(value)) break
        const values =
          options.containsSplitSpaces && /\x20/.test(value)
            ? value.split(/\x20+/)
            : [value]
        for (const value of values) {
          // field LIKE `%${value}%`
          cond.and(field, 'like', `%${value}%`)
        }
        break
      }
      case 'not_contains': {
        if (!value) break
        if (Array.isArray(value)) break
        const values =
          options.containsSplitSpaces && /\x20/.test(value)
            ? value.split(/\x20+/)
            : [value]
        for (const value of values) {
          // field NOT LIKE `%${value}%`
          cond.and(field, 'not like', `%${value}%`)
        }
        break
      }
      case 'in': {
        if (!Array.isArray(value) || !value.length) {
          break
        }
        // field IN value
        cond.and(field, 'in', value)
        break
      }
    }
  }
}
