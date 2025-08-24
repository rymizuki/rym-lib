import {
  createBuilder,
  createConditions,
  is_not_null,
  is_null,
  SQLBuilderPort,
} from 'coral-sql'

import type { QueryCriteriaInterface } from '@rym-lib/query-module'

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

export function buildSQL(
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

        const property = filter[name]
        if (!property) continue

        for (const operator of keys(property)) {
          const value = property[operator]
          switch (operator) {
            case 'eq': {
              if (value === null) {
                if (isRawSqlExpression(name)) {
                  // (raw_expression) IS NULL
                  cond.and(`(${name})`, is_null())
                } else {
                  // name IS NULL
                  cond.and(name, is_null())
                }
              } else {
                if (isRawSqlExpression(name)) {
                  // (raw_expression) = value
                  cond.and(`(${name})`, '=', value)
                } else {
                  // name = value
                  cond.and(name, value)
                }
              }
              break
            }
            case 'ne': {
              if (value === null) {
                if (isRawSqlExpression(name)) {
                  // (raw_expression) IS NOT NULL
                  cond.and(`(${name})`, is_not_null())
                } else {
                  // name IS NOT NULL
                  cond.and(name, is_not_null())
                }
              } else {
                if (isRawSqlExpression(name)) {
                  // (raw_expression) != value
                  cond.and(`(${name})`, '!=', value)
                } else {
                  // name != value
                  cond.and(name, '!=', value)
                }
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
              if (!value) break
              const values =
                o.containsSplitSpaces && /\x20/.test(value)
                  ? value.split(/\x20+/)
                  : [value]
              for (const value of values) {
                // name LIKE `%${value}%`
                cond.and(name, 'like', `%${value}%`)
              }
              break
            }
            case 'not_contains': {
              if (!value) break
              const values =
                o.containsSplitSpaces && /\x20/.test(value)
                  ? value.split(/\x20+/)
                  : [value]
              for (const value of values) {
                // name LIKE `%${value}%`
                cond.and(name, 'not like', `%${value}%`)
              }
              break
            }
            case 'in': {
              if (!Array.isArray(value) || !value.length) {
                break
              }
              if (isRawSqlExpression(name)) {
                // (raw_expression) IN value
                cond.and(`(${name})`, 'in', value)
              } else {
                // name IN value
                cond.and(name, 'in', value)
              }
              break
            }
          }
        }
      }

      whole.or(cond)
    }
    builder.where(whole)
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
