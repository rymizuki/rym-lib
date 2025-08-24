import {
  createBuilder,
  createConditions,
  is_not_null,
  is_null,
  SQLBuilderConditionExpressionPort,
  SQLBuilderConditions,
  SQLBuilderConditionsPort,
  SQLBuilderPort,
  unescape,
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

function isRawSqlExpression(fieldName: string): boolean {
  // Check if the field name contains SQL keywords or complex expressions
  const sqlKeywords = [
    'CASE',
    'WHEN',
    'THEN',
    'ELSE',
    'END',
    'CONCAT',
    'COALESCE',
    'SUBSTRING',
    'LENGTH',
    'COUNT',
    'SUM',
    'AVG',
    'MAX',
    'MIN',
    'UPPER',
    'LOWER',
    'TRIM',
    '(',
    ')',
    '+',
    '-',
    '*',
    '/',
  ]

  const upperFieldName = fieldName.toUpperCase()

  // Check for SQL keywords or complex expressions
  return sqlKeywords.some((keyword) => upperFieldName.includes(keyword))
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

      // filter -> where
      for (const name of keys(filter)) {
        if (typeof name !== 'string') continue
        if (/^having:/.test(name)) continue

        const property = filter[name]
        if (!property) continue

        createCond(cond, name, property as QueryFilter<any>, o)
      }

      whole.or(cond)
    }
    builder.where(whole)

    const whole_having = createConditions()
    for (const filter of Array.isArray(criteria.filter)
      ? criteria.filter
      : [criteria.filter]) {
      const cond = createConditions()

      // filter -> where
      for (const name of keys(filter)) {
        if (typeof name !== 'string') continue
        if (!/^having:/.test(name)) continue

        const property = filter[name]
        if (!property) continue

        const column_name = name.replace(/^having:/, '')
        createCond(cond, column_name, property as QueryFilter<any>, o, true)
      }

      whole_having.or(cond)
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
  useUnescape = false,
) {
  // If useUnescape is true, use unescape to avoid backticks for SQL functions
  const field = useUnescape ? unescape(name) : name
  for (const operator of keys(property)) {
    const value = property[operator] as
      | string
      | string[]
      | SQLBuilderPort
      | SQLBuilderConditionsPort
      | SQLBuilderConditionExpressionPort

    console.log(
      'Checking value:',
      value,
      'type:',
      typeof value,
      'instanceof SQLBuilderConditions:',
      value instanceof SQLBuilderConditions,
      'has toSQL:',
      value !== null && typeof value === 'object' && 'toSQL' in value,
    )

    if (value instanceof SQLBuilderConditions) {
      cond.and(value)
      continue
    }
    if (value !== null && typeof value === 'object' && 'toSQL' in value) {
      cond.and(value as Exclude<typeof value, SQLBuilderConditionsPort>)
      continue
    }

    // Check if value is a raw SQL expression (from function-based rules)
    console.log(
      'Checking if value is SQL expression:',
      value,
      'isRawSql:',
      typeof value === 'string' ? isRawSqlExpression(value) : false,
    )
    if (typeof value === 'string' && isRawSqlExpression(value)) {
      console.log('Using SQL expression as field!')
      // Use the SQL expression as the field name
      switch (operator) {
        case 'eq': {
          cond.and(`(${value})`, '=', '?')
          break
        }
        case 'ne': {
          cond.and(`(${value})`, '!=', '?')
          break
        }
        default: {
          cond.and(`(${value})`, operator as any, '?')
        }
      }
      continue
    }

    switch (operator) {
      case 'eq': {
        if (value === null) {
          if (!useUnescape && isRawSqlExpression(name)) {
            // (raw_expression) IS NULL
            cond.and(`(${name})`, is_null())
          } else {
            // field IS NULL
            cond.and(field, is_null())
          }
        } else {
          if (!useUnescape && isRawSqlExpression(name)) {
            // (raw_expression) = value
            cond.and(`(${name})`, '=', value)
          } else {
            // field = value
            cond.and(field, value)
          }
        }
        break
      }
      case 'ne': {
        if (value === null) {
          if (!useUnescape && isRawSqlExpression(name)) {
            // (raw_expression) IS NOT NULL
            cond.and(`(${name})`, is_not_null())
          } else {
            // field IS NOT NULL
            cond.and(field, is_not_null())
          }
        } else {
          if (!useUnescape && isRawSqlExpression(name)) {
            // (raw_expression) != value
            cond.and(`(${name})`, '!=', value)
          } else {
            // field != value
            cond.and(field, '!=', value)
          }
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
        if (!useUnescape && isRawSqlExpression(name)) {
          // (raw_expression) IN value
          cond.and(`(${name})`, 'in', value)
        } else {
          // field IN value
          cond.and(field, 'in', value)
        }
        break
      }
    }
  }
}
