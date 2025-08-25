import {
  createBuilder,
  createConditions,
  is_not_null,
  is_null,
  SQLBuilderPort,
  SQLBuilderConditionsPort,
} from 'coral-sql'

import type {
  QueryCriteriaInterface,
  QueryDriverInterface,
  QueryFilter,
} from '@rym-lib/query-module'

export { createBuilder }

type BuildSqlOptions = {
  containsSplitSpaces: boolean
}

function keys<T extends Record<string, unknown>>(value: T) {
  return Object.keys(value) as (keyof T)[]
}

const defaults: BuildSqlOptions = {
  containsSplitSpaces: true,
}

export function buildSQL<Driver extends QueryDriverInterface>(
  builder: SQLBuilderPort,
  criteria: QueryCriteriaInterface,
  options: Partial<BuildSqlOptions> = {},
) {
  const o = { ...defaults, ...options }
  if (criteria.filter) {
    const whole = createConditions()
    for (const filter of Array.isArray(criteria.filter)
      ? criteria.filter
      : [criteria.filter]) {
      const cond = createConditions()
      let hasCondition = false

      // filter -> where
      for (const name of keys(filter)) {
        if (typeof name !== 'string') continue
        if (/^having:/.test(name)) continue

        const property = filter[name]
        if (!property) continue

        hasCondition = true
        
        // Handle new QueryCriteriaFilter format: { column, value }
        if (property && typeof property === 'object' && 'value' in property && 'column' in property) {
          const columnName = property.column && typeof property.column === 'function' 
            ? property.column().toSQL()[0] // Use toSQL() method for coral-sql objects
            : (typeof property.column === 'string' ? property.column : name) // Use column name or fallback to field name
          createCond(cond, columnName, property.value as QueryFilter<any>, o)
        } else {
          // Handle legacy QueryFilter format
          createCond(cond, name, property as QueryFilter<any>, o)
        }
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
      const cond = createConditions()
      let hasHavingCondition = false

      // filter -> having
      for (const name of keys(filter)) {
        if (typeof name !== 'string') continue
        if (!/^having:/.test(name)) continue

        const property = filter[name]
        if (!property) continue

        const column_name = name.replace(/^having:/, '')
        hasHavingCondition = true
        
        // Handle new QueryCriteriaFilter format: { column, value }
        if (property && typeof property === 'object' && 'value' in property && 'column' in property) {
          const columnName = property.column && typeof property.column === 'function' 
            ? property.column().toSQL()[0] // Use toSQL() method for coral-sql objects
            : (typeof property.column === 'string' ? property.column : column_name) // Use column name or fallback to parsed name
          createCond(cond, columnName, property.value as QueryFilter<any>, o)
        } else {
          // Handle legacy QueryFilter format
          createCond(cond, column_name, property as QueryFilter<any>, o)
        }
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

function createCond(
  cond: SQLBuilderConditionsPort,
  name: string,
  property: QueryFilter<any>,
  options: BuildSqlOptions,
) {
  const field = name
  for (const operator of keys(property)) {
    const value = property[operator] as string | string[]


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
