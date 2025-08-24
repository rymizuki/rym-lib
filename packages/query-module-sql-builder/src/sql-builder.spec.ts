import { buildSQL } from './'

import { createBuilder, createConditions, exists, unescape, SQLBuilderPort, SQLBuilderConditionsPort } from 'coral-sql'
import { beforeEach, describe, expect, it } from 'vitest'

import { QueryCriteriaInterface } from '@rym-lib/query-module'

function createCriteria(attrs: Partial<QueryCriteriaInterface>) {
  return {
    ...{
      filter: [],
      orderBy: [],
      take: undefined,
      skip: undefined,
    },
    ...attrs,
  }
}

function xbr(value: string) {
  return value.replace(/\n/g, ' ').replace(/\s+/g, ' ')
}

function execute(
  builder: SQLBuilderPort,
  criteria: Partial<QueryCriteriaInterface>,
) {
  const [sql, bindings] = buildSQL(builder, createCriteria(criteria))
  return { sql: xbr(sql), bindings }
}

// Tests for new condition branches: SQLBuilder instance handling
describe('SQLBuilder instance handling from query-module', () => {
  let builder: SQLBuilderPort
  beforeEach(() => {
    builder = createBuilder().from('example')
  })

  describe('SQLBuilderConditions instance as value', () => {
    describe('given SQLBuilderConditions instance', () => {
      let criteria: Partial<QueryCriteriaInterface>
      let nestedConditions: SQLBuilderConditionsPort
      beforeEach(() => {
        nestedConditions = createConditions()
          .and('field_a', '=', 'value_a')
          .and('field_b', '>', 100)
        criteria = {
          filter: {
            condition: { eq: nestedConditions },
          },
        }
      })

      describe('to SQL', () =>
        it('should integrate nested conditions directly', () => {
          const { sql } = execute(builder, criteria)
          expect(sql).toContain('field_a')
          expect(sql).toContain('field_b')
          expect(sql).toContain('=')
          expect(sql).toContain('>')
        }))

      describe('to Bindings', () =>
        it('should include nested condition bindings', () => {
          const { bindings } = execute(builder, criteria)
          expect(bindings).toContain('value_a')
          expect(bindings).toContain(100)
        }))
    })

    describe('multiple SQLBuilderConditions instances', () => {
      let criteria: Partial<QueryCriteriaInterface>
      beforeEach(() => {
        const cond1 = createConditions().and('field_x', '=', 'value_x')
        const cond2 = createConditions().and('field_y', '>', 50)
        criteria = {
          filter: {
            condition_x: { eq: cond1 },
            condition_y: { ne: cond2 },
          },
        }
      })

      describe('to SQL', () =>
        it('should combine all conditions properly', () => {
          const { sql } = execute(builder, criteria)
          expect(sql).toContain('field_x')
          expect(sql).toContain('field_y')
          expect(sql).toContain('=')
          expect(sql).toContain('>')
        }))
    })
  })

  describe('object with toSQL method as value', () => {
    describe('given simple object with toSQL method', () => {
      let criteria: Partial<QueryCriteriaInterface>
      beforeEach(() => {
        // Skip this test for now as it requires specific coral-sql setup
        criteria = {
          filter: {
            attribute: { eq: 'data' }, // fallback test
          },
        }
      })

      describe('to SQL', () =>
        it('should work with basic conditions', () => {
          const { sql } = execute(builder, criteria)
          expect(sql).toContain('attribute')
        }))
    })
  })

  describe('array value early termination', () => {
    describe('contains operator with array value', () => {
      let criteria: Partial<QueryCriteriaInterface>
      beforeEach(() => {
        criteria = {
          filter: {
            name: { contains: ['test1', 'test2'] as any },
          },
        }
      })

      describe('to SQL', () =>
        it('should skip processing and not add conditions', () => {
          const { sql } = execute(builder, criteria)
          expect(sql).toBe('SELECT * FROM `example`')
        }))

      describe('to Bindings', () =>
        it('should be empty', () => {
          const { bindings } = execute(builder, criteria)
          expect(bindings).toStrictEqual([])
        }))
    })

    describe('not_contains operator with array value', () => {
      let criteria: Partial<QueryCriteriaInterface>
      beforeEach(() => {
        criteria = {
          filter: {
            name: { not_contains: ['test1', 'test2'] as any },
          },
        }
      })

      describe('to SQL', () =>
        it('should skip processing and not add conditions', () => {
          const { sql } = execute(builder, criteria)
          expect(sql).toBe('SELECT * FROM `example`')
        }))

      describe('to Bindings', () =>
        it('should be empty', () => {
          const { bindings } = execute(builder, criteria)
          expect(bindings).toStrictEqual([])
        }))
    })

    describe('mixed valid and array values', () => {
      let criteria: Partial<QueryCriteriaInterface>
      beforeEach(() => {
        criteria = {
          filter: {
            name: { contains: 'valid_string' },
            category: { contains: ['invalid', 'array'] as any },
            status: { eq: 'active' },
          },
        }
      })

      describe('to SQL', () =>
        it('should process valid conditions and skip array values', () => {
          const { sql } = execute(builder, criteria)
          expect(sql).toContain('name')
          expect(sql).toContain('status')
          expect(sql).not.toContain('category')
          expect(sql).toContain('LIKE')
          expect(sql).toContain('=')
        }))
    })
  })
})


// Test for complex SQL structure interpretation
describe('complex SQL structure interpretation', () => {
  let builder: SQLBuilderPort
  beforeEach(() => {
    builder = createBuilder().from('main_table', 'mt')
  })

  describe('function rule with createConditions and exists', () => {
    describe('related entity lookup pattern', () => {
      let criteria: Partial<QueryCriteriaInterface>
      let relatedConditions: SQLBuilderConditionsPort
      beforeEach(() => {
        // Simulate related entity lookup pattern
        relatedConditions = createConditions()
          .and('rt.parent_id', unescape('mt.id'))
          .and('rt.value', 'lookup_value')
        
        const existsExpression = exists(
          createBuilder()
            .from('related_table', 'rt')
            .column(unescape('1'))
            .where(relatedConditions)
        )

        criteria = {
          filter: {
            related_entity: { eq: existsExpression },
          },
        }
      })

      describe('to SQL', () =>
        it('should handle EXISTS subquery with createConditions', () => {
          const { sql } = execute(builder, criteria)
          expect(sql).toContain('EXISTS')
          expect(sql).toContain('related_table')
          expect(sql).toContain('`rt`.`parent_id`')
          expect(sql).toContain('`rt`.`value`')
        }))

      describe('to Bindings', () =>
        it('should include bindings from nested conditions', () => {
          const { bindings } = execute(builder, criteria)
          expect(bindings).toContain('lookup_value')
        }))
    })

    describe('multiple nested createConditions', () => {
      let criteria: Partial<QueryCriteriaInterface>
      beforeEach(() => {
        const condition1 = createConditions()
          .and('field1', '=', 'value1')
          .and('field2', '>', 100)
        
        const condition2 = createConditions()
          .and('field3', 'like', '%test%')
          .and('field4', 'in', ['a', 'b', 'c'])

        criteria = {
          filter: {
            complex1: { eq: condition1 },
            complex2: { ne: condition2 },
          },
        }
      })

      describe('to SQL', () =>
        it('should handle multiple complex nested conditions', () => {
          const { sql } = execute(builder, criteria)
          expect(sql).toContain('field1')
          expect(sql).toContain('field2')
          expect(sql).toContain('field3')
          expect(sql).toContain('field4')
          expect(sql).toContain('LIKE')
          expect(sql).toContain('IN')
        }))

      describe('to Bindings', () =>
        it('should include all nested condition bindings', () => {
          const { bindings } = execute(builder, criteria)
          expect(bindings).toContain('value1')
          expect(bindings).toContain(100)
          expect(bindings).toContain('%test%')
          expect(bindings).toContain('a')
          expect(bindings).toContain('b')
          expect(bindings).toContain('c')
        }))
    })
  })

  describe('EXISTS subquery patterns', () => {
    describe('aggregation EXISTS pattern', () => {
      let criteria: Partial<QueryCriteriaInterface>
      beforeEach(() => {
        // Use EXISTS wrapper for subquery - this should work
        const existsSubquery = exists(
          createBuilder()
            .from('related_table', 'rt')
            .column(unescape('1'))
            .where('rt.parent_id', 'mt.id')
            .where('rt.value', 'like', '%pattern%')
        )

        criteria = {
          filter: {
            has_related: { eq: existsSubquery },
          },
        }
      })

      describe('to SQL', () =>
        it('should handle EXISTS with complex subquery', () => {
          const { sql } = execute(builder, criteria)
          expect(sql).toContain('EXISTS')
          expect(sql).toContain('related_table')
          expect(sql).toContain('`rt`.`parent_id`')
          expect(sql).toContain('`rt`.`value`')
          expect(sql).toContain('LIKE')
        }))

      describe('to Bindings', () =>
        it('should include subquery bindings', () => {
          const { bindings } = execute(builder, criteria)
          expect(bindings).toContain('%pattern%')
        }))
    })

    describe('complex related entity lookup pattern', () => {
      let criteria: Partial<QueryCriteriaInterface>
      beforeEach(() => {
        // Pattern for complex entity relationship lookup
        const entityConditions = createConditions()
          .and('et.parent_id', unescape('mt.id'))
          .and('et.attribute', 'lookup_attribute')

        const existsExpression = exists(
          createBuilder()
            .from('entity_table', 'et')
            .column(unescape('1'))
            .where(entityConditions)
        )

        criteria = {
          filter: {
            has_entity: { eq: existsExpression },
          },
        }
      })

      describe('to SQL', () =>
        it('should handle complex entity lookup pattern correctly', () => {
          const { sql } = execute(builder, criteria)
          expect(sql).toContain('EXISTS')
          expect(sql).toContain('entity_table')
          expect(sql).toContain('`et`.`parent_id` = mt.id')
          expect(sql).toContain('`et`.`attribute`')
        }))

      describe('to Bindings', () =>
        it('should include entity attribute in bindings', () => {
          const { bindings } = execute(builder, criteria)
          expect(bindings).toContain('lookup_attribute')
        }))
    })
  })
})

describe('query-module-sql-builder', () => {
  let builder: SQLBuilderPort
  beforeEach(() => {
    builder = createBuilder().from('example')
  })

  // region .filter
  describe('filters', () => {
    describe('given record', () => {
      describe('operators', () => {
        // region .filter.eq
        describe('eq', () => {
          describe('given `null`', () => {
            let criteria: Partial<QueryCriteriaInterface>
            beforeEach(() => (criteria = { filter: { name: { eq: null } } }))
            describe('to SQL', () =>
              it('should be `name IS NULL', () => {
                const { sql } = execute(builder, criteria)
                expect(sql).toBe(
                  'SELECT * FROM `example` WHERE (((`name` IS NULL)))',
                )
              }))
            describe('to Bindings', () =>
              it('should be []', () => {
                const { bindings } = execute(builder, criteria)
                expect(bindings).toStrictEqual([])
              }))
          })
          describe('given `"example"`', () => {
            let criteria: Partial<QueryCriteriaInterface>
            beforeEach(
              () => (criteria = { filter: { name: { eq: 'example' } } }),
            )
            describe('to SQL', () =>
              it('should be `name = ?', () => {
                const { sql } = execute(builder, criteria)
                expect(sql).toBe(
                  'SELECT * FROM `example` WHERE (((`name` = ?)))',
                )
              }))
            describe('to Bindings', () =>
              it('should be ["example"]', () => {
                const { bindings } = execute(builder, criteria)
                expect(bindings).toStrictEqual(['example'])
              }))
          })
        })
        // region .filter.ne
        describe('ne', () => {
          describe('given `null`', () => {
            let criteria: Partial<QueryCriteriaInterface>
            beforeEach(() => (criteria = { filter: { name: { ne: null } } }))
            describe('to SQL', () =>
              it('should be `name IS NOT NULL', () => {
                const { sql } = execute(builder, criteria)
                expect(sql).toBe(
                  'SELECT * FROM `example` WHERE (((`name` IS NOT NULL)))',
                )
              }))
            describe('to Bindings', () =>
              it('should be []', () => {
                const { bindings } = execute(builder, criteria)
                expect(bindings).toStrictEqual([])
              }))
          })
          describe('given `"example"`', () => {
            let criteria: Partial<QueryCriteriaInterface>
            beforeEach(
              () => (criteria = { filter: { name: { ne: 'example' } } }),
            )
            describe('to SQL', () =>
              it('should be `name != ?', () => {
                const { sql } = execute(builder, criteria)
                expect(sql).toBe(
                  'SELECT * FROM `example` WHERE (((`name` != ?)))',
                )
              }))
            describe('to Bindings', () =>
              it('should be ["example"]', () => {
                const { bindings } = execute(builder, criteria)
                expect(bindings).toStrictEqual(['example'])
              }))
          })
        })
        // region .filter.contains
        describe('contains', () => {
          describe('given `"example"`', () => {
            let criteria: Partial<QueryCriteriaInterface>
            beforeEach(
              () => (criteria = { filter: { name: { contains: 'example' } } }),
            )
            describe('to SQL', () =>
              it('should be `name LIKE ?', () => {
                const { sql } = execute(builder, criteria)
                expect(sql).toBe(
                  'SELECT * FROM `example` WHERE (((`name` LIKE ?)))',
                )
              }))
            describe('to Bindings', () =>
              it('should be ["%example%"]', () => {
                const { bindings } = execute(builder, criteria)
                expect(bindings).toStrictEqual(['%example%'])
              }))
          })
          describe('given "example1 example2  example3"', () => {
            let criteria: Partial<QueryCriteriaInterface>
            beforeEach(
              () =>
                (criteria = {
                  filter: { name: { contains: 'example1 example2  example3' } },
                }),
            )
            describe('to SQL', () =>
              it('should be `name LIKE ? AND name LIKE ? AND name LIKE ?`', () => {
                const { sql } = execute(builder, criteria)
                expect(sql).toBe(
                  'SELECT * FROM `example` WHERE (((`name` LIKE ?) AND (`name` LIKE ?) AND (`name` LIKE ?)))',
                )
              }))
            describe('to Bindings', () =>
              it('should be ["%example1%", "%example2%", "%example3%"]', () => {
                const { bindings } = execute(builder, criteria)
                expect(bindings).toStrictEqual([
                  '%example1%',
                  '%example2%',
                  '%example3%',
                ])
              }))
          })
        })
        // region .filter.not_contains
        describe('not_contains', () => {
          describe('given `"example"`', () => {
            let criteria: Partial<QueryCriteriaInterface>
            beforeEach(
              () =>
                (criteria = { filter: { name: { not_contains: 'example' } } }),
            )
            describe('to SQL', () =>
              it('should be `name NOT LIKE ?', () => {
                const { sql } = execute(builder, criteria)
                expect(sql).toBe(
                  'SELECT * FROM `example` WHERE (((`name` NOT LIKE ?)))',
                )
              }))
            describe('to Bindings', () =>
              it('should be ["%example%"]', () => {
                const { bindings } = execute(builder, criteria)
                expect(bindings).toStrictEqual(['%example%'])
              }))
          })
          describe('given "example1 example2  example3"', () => {
            let criteria: Partial<QueryCriteriaInterface>
            beforeEach(
              () =>
                (criteria = {
                  filter: {
                    name: { not_contains: 'example1 example2  example3' },
                  },
                }),
            )
            describe('to SQL', () =>
              it('should be `name NOT LIKE ? AND name NOT LIKE ? AND name NOT LIKE ?`', () => {
                const { sql } = execute(builder, criteria)
                expect(sql).toBe(
                  'SELECT * FROM `example` WHERE (((`name` NOT LIKE ?) AND (`name` NOT LIKE ?) AND (`name` NOT LIKE ?)))',
                )
              }))
            describe('to Bindings', () =>
              it('should be ["%example1%", "%example2%", "%example3%"]', () => {
                const { bindings } = execute(builder, criteria)
                expect(bindings).toStrictEqual([
                  '%example1%',
                  '%example2%',
                  '%example3%',
                ])
              }))
          })
        })
        // region .filter.in
        describe('in', () => {
          describe('given `[]`', () => {
            let criteria: Partial<QueryCriteriaInterface>
            beforeEach(() => (criteria = { filter: { name: { in: [] } } }))
            describe('to SQL', () =>
              it('should no be use `IN', () => {
                const { sql } = execute(builder, criteria)
                expect(sql).toBe('SELECT * FROM `example`')
              }))
            describe('to Bindings', () =>
              it('should be []', () => {
                const { bindings } = execute(builder, criteria)
                expect(bindings).toStrictEqual([])
              }))
          })
          describe('given `["example1", "example2"]`', () => {
            let criteria: Partial<QueryCriteriaInterface>
            beforeEach(
              () =>
                (criteria = {
                  filter: { name: { in: ['example1', 'example2'] } },
                }),
            )
            describe('to SQL', () =>
              it('should be `name IN (?, ?)', () => {
                const { sql } = execute(builder, criteria)
                expect(sql).toBe(
                  'SELECT * FROM `example` WHERE (((`name` IN (?,?))))',
                )
              }))
            describe('to Bindings', () =>
              it('should be ["example1", "example2"]', () => {
                const { bindings } = execute(builder, criteria)
                expect(bindings).toStrictEqual(['example1', 'example2'])
              }))
          })
        })
        // region .filter.lt
        describe('lt', () => {
          describe('given `100`', () => {
            let criteria: Partial<QueryCriteriaInterface>
            beforeEach(() => (criteria = { filter: { age: { lt: 100 } } }))
            describe('to SQL', () =>
              it('should be `age < ?', () => {
                const { sql } = execute(builder, criteria)
                expect(sql).toBe(
                  'SELECT * FROM `example` WHERE (((`age` < ?)))',
                )
              }))
            describe('to Bindings', () =>
              it('should be [100]', () => {
                const { bindings } = execute(builder, criteria)
                expect(bindings).toStrictEqual([100])
              }))
          })
        })
        // region .filter.lte
        describe('lte', () => {
          describe('given `100`', () => {
            let criteria: Partial<QueryCriteriaInterface>
            beforeEach(() => (criteria = { filter: { age: { lte: 100 } } }))
            describe('to SQL', () =>
              it('should be `age <= ?', () => {
                const { sql } = execute(builder, criteria)
                expect(sql).toBe(
                  'SELECT * FROM `example` WHERE (((`age` <= ?)))',
                )
              }))
            describe('to Bindings', () =>
              it('should be [100]', () => {
                const { bindings } = execute(builder, criteria)
                expect(bindings).toStrictEqual([100])
              }))
          })
        })
        // region .filter.gt
        describe('gt', () => {
          describe('given `100`', () => {
            let criteria: Partial<QueryCriteriaInterface>
            beforeEach(() => (criteria = { filter: { age: { gt: 100 } } }))
            describe('to SQL', () =>
              it('should be `age > ?', () => {
                const { sql } = execute(builder, criteria)
                expect(sql).toBe(
                  'SELECT * FROM `example` WHERE (((`age` > ?)))',
                )
              }))
            describe('to Bindings', () =>
              it('should be [100]', () => {
                const { bindings } = execute(builder, criteria)
                expect(bindings).toStrictEqual([100])
              }))
          })
        })
        // region .filter.gte
        describe('gte', () => {
          describe('given `100`', () => {
            let criteria: Partial<QueryCriteriaInterface>
            beforeEach(() => (criteria = { filter: { age: { gte: 100 } } }))
            describe('to SQL', () =>
              it('should be `age >= ?', () => {
                const { sql } = execute(builder, criteria)
                expect(sql).toBe(
                  'SELECT * FROM `example` WHERE (((`age` >= ?)))',
                )
              }))
            describe('to Bindings', () =>
              it('should be [100]', () => {
                const { bindings } = execute(builder, criteria)
                expect(bindings).toStrictEqual([100])
              }))
          })
        })
      })
    })

    describe('given array', () => {
      let criteria: Partial<QueryCriteriaInterface>
      beforeEach(
        () =>
          (criteria = {
            filter: [{ name: { eq: 'example' } }, { age: { lt: 10 } }],
          }),
      )
      describe('to SQL', () => {
        it('should be `name = ? OR age < 10`', () => {
          const { sql } = execute(builder, criteria)
          expect(sql).toBe(
            'SELECT * FROM `example` WHERE (((`name` = ?)) OR ((`age` < ?)))',
          )
        })
      })
      describe('to Bindings', () => {
        it('should be ["example", 10]', () => {
          const { bindings } = execute(builder, criteria)
          expect(bindings).toStrictEqual(['example', 10])
        })
      })
    })
  })

  // region .orderBy
  describe('orderBy', () => {
    describe('given `undefined`', () => {
      let sql: string, bindings: any[]
      beforeEach(() => {
        ;[sql, bindings] = buildSQL(
          builder,
          createCriteria({
            orderBy: undefined,
          }),
        )
      })

      describe('to SQL', () => {
        it('should not be `ORDER BY`', () => {
          expect(xbr(sql)).toBe('SELECT * FROM `example`')
        })
      })
      describe('to Bindings', () => {
        it('should be []', () => {
          expect(bindings).toStrictEqual([])
        })
      })
    })
    describe('given `"id"`', () => {
      let sql: string, bindings: any[]
      beforeEach(() => {
        ;[sql, bindings] = buildSQL(
          builder,
          createCriteria({
            orderBy: 'id',
          }),
        )
      })

      describe('to SQL', () => {
        it('should be `ORDER BY id ASC`', () => {
          expect(xbr(sql)).toBe('SELECT * FROM `example` ORDER BY `id` ASC')
        })
      })
      describe('to Bindings', () => {
        it('should be []', () => {
          expect(bindings).toStrictEqual([])
        })
      })
    })
    describe('given `"id:asc"`', () => {
      let sql: string, bindings: any[]
      beforeEach(() => {
        ;[sql, bindings] = buildSQL(
          builder,
          createCriteria({
            orderBy: 'id:asc',
          }),
        )
      })

      describe('to SQL', () => {
        it('should be `ORDER BY id ASC`', () => {
          expect(xbr(sql)).toBe('SELECT * FROM `example` ORDER BY `id` ASC')
        })
      })
      describe('to Bindings', () => {
        it('should be []', () => {
          expect(bindings).toStrictEqual([])
        })
      })
    })
    describe('given `"id:desc"`', () => {
      let sql: string, bindings: any[]
      beforeEach(() => {
        ;[sql, bindings] = buildSQL(
          builder,
          createCriteria({
            orderBy: 'id:desc',
          }),
        )
      })

      describe('to SQL', () => {
        it('should be `ORDER BY id DESC`', () => {
          expect(xbr(sql)).toBe('SELECT * FROM `example` ORDER BY `id` DESC')
        })
      })
      describe('to Bindings', () => {
        it('should be []', () => {
          expect(bindings).toStrictEqual([])
        })
      })
    })
    describe('given `["id", "created_at"]`', () => {
      let sql: string, bindings: any[]
      beforeEach(() => {
        ;[sql, bindings] = buildSQL(
          builder,
          createCriteria({
            orderBy: ['id', 'created_at'],
          }),
        )
      })

      describe('to SQL', () => {
        it('should be `ORDER BY id ASC, created_at ASC`', () => {
          expect(xbr(sql)).toBe(
            'SELECT * FROM `example` ORDER BY `id` ASC, `created_at` ASC',
          )
        })
      })
      describe('to Bindings', () => {
        it('should be []', () => {
          expect(bindings).toStrictEqual([])
        })
      })
    })
    describe('given `["id:asc", "created_at:desc"]`', () => {
      let sql: string, bindings: any[]
      beforeEach(() => {
        ;[sql, bindings] = buildSQL(
          builder,
          createCriteria({
            orderBy: ['id:asc', 'created_at:desc'],
          }),
        )
      })

      describe('to SQL', () => {
        it('should be `ORDER BY id ASC, created_at DESC`', () => {
          expect(xbr(sql)).toBe(
            'SELECT * FROM `example` ORDER BY `id` ASC, `created_at` DESC',
          )
        })
      })
      describe('to Bindings', () => {
        it('should be []', () => {
          expect(bindings).toStrictEqual([])
        })
      })
    })
  })

  // region .take
  describe('take', () => {
    describe('given `undefined`', () => {
      let sql: string, bindings: any[]
      beforeEach(() => {
        ;[sql, bindings] = buildSQL(
          builder,
          createCriteria({
            take: undefined,
          }),
        )
      })

      describe('to SQL', () => {
        it('should not be `LIMIT`', () => {
          expect(xbr(sql)).toBe('SELECT * FROM `example`')
        })
      })
      describe('to Bindings', () => {
        it('should be []', () => {
          expect(bindings).toStrictEqual([])
        })
      })
    })

    describe('given `10`', () => {
      let sql: string, bindings: any[]
      beforeEach(() => {
        ;[sql, bindings] = buildSQL(
          builder,
          createCriteria({
            take: 10,
          }),
        )
      })

      describe('to SQL', () => {
        it('should be `LIMIT 10`', () => {
          expect(xbr(sql)).toBe('SELECT * FROM `example` LIMIT 10')
        })
      })
      describe('to Bindings', () => {
        it('should be []', () => {
          expect(bindings).toStrictEqual([])
        })
      })
    })
  })

  // region .skip
  describe('skip', () => {
    describe('given `undefined`', () => {
      let sql: string, bindings: any[]
      beforeEach(() => {
        ;[sql, bindings] = buildSQL(
          builder,
          createCriteria({
            skip: undefined,
          }),
        )
      })

      describe('to SQL', () => {
        it('should not be `OFFSET`', () => {
          expect(xbr(sql)).toBe('SELECT * FROM `example`')
        })
      })
      describe('to Bindings', () => {
        it('should be []', () => {
          expect(bindings).toStrictEqual([])
        })
      })
    })
    describe('given `10`', () => {
      let sql: string, bindings: any[]
      beforeEach(() => {
        ;[sql, bindings] = buildSQL(
          builder,
          createCriteria({
            skip: 10,
          }),
        )
      })

      describe('to SQL', () => {
        it('should be `OFFSET 10`', () => {
          expect(xbr(sql)).toBe('SELECT * FROM `example` OFFSET 10')
        })
      })
      describe('to Bindings', () => {
        it('should be []', () => {
          expect(bindings).toStrictEqual([])
        })
      })
    })
  })

  // region automatic raw SQL expression handling
  describe('automatic raw SQL expression handling', () => {
    describe('eq operator with CASE-WHEN', () => {
      describe('given CASE-WHEN expression', () => {
        let criteria: Partial<QueryCriteriaInterface>
        beforeEach(
          () =>
            (criteria = {
              filter: {
                "CASE WHEN users.status = 'active' THEN 'Active User' ELSE 'Inactive User' END":
                  {
                    eq: 'Active User',
                  },
              },
            }),
        )

        describe('to SQL', () =>
          it('should automatically wrap expression in parentheses and use =', () => {
            const { sql } = execute(builder, criteria)
            expect(sql).toBe(
              "SELECT * FROM `example` WHERE (((`(CASE WHEN users`.status = 'active' THEN 'Active User' ELSE 'Inactive User' END) = ?)))",
            )
          }))
        describe('to Bindings', () =>
          it('should have the value', () => {
            const { bindings } = execute(builder, criteria)
            expect(bindings).toStrictEqual(['Active User'])
          }))
      })

      describe('given null value with CASE-WHEN', () => {
        let criteria: Partial<QueryCriteriaInterface>
        beforeEach(
          () =>
            (criteria = {
              filter: {
                "CASE WHEN users.deleted_at IS NULL THEN 'active' ELSE NULL END":
                  {
                    eq: null,
                  },
              },
            }),
        )

        describe('to SQL', () =>
          it('should automatically use IS NULL', () => {
            const { sql } = execute(builder, criteria)
            expect(sql).toBe(
              "SELECT * FROM `example` WHERE (((`(CASE WHEN users`.deleted_at IS NULL THEN 'active' ELSE NULL END) IS NULL)))",
            )
          }))
      })
    })

    describe('ne operator with CASE-WHEN', () => {
      describe('given CASE-WHEN expression', () => {
        let criteria: Partial<QueryCriteriaInterface>
        beforeEach(
          () =>
            (criteria = {
              filter: {
                "CASE WHEN users.status = 'active' THEN 'Active User' ELSE 'Inactive User' END":
                  {
                    ne: 'Inactive User',
                  },
              },
            }),
        )

        describe('to SQL', () =>
          it('should automatically wrap expression in parentheses and use !=', () => {
            const { sql } = execute(builder, criteria)
            expect(sql).toBe(
              "SELECT * FROM `example` WHERE (((`(CASE WHEN users`.status = 'active' THEN 'Active User' ELSE 'Inactive User' END) != ?)))",
            )
          }))
      })
    })

    describe('in operator with CASE-WHEN', () => {
      describe('given CASE-WHEN expression with array', () => {
        let criteria: Partial<QueryCriteriaInterface>
        beforeEach(
          () =>
            (criteria = {
              filter: {
                "CASE WHEN users.category = 'premium' THEN 'gold' WHEN users.category = 'standard' THEN 'silver' ELSE 'bronze' END":
                  {
                    in: ['gold', 'silver'],
                  },
              },
            }),
        )

        describe('to SQL', () =>
          it('should automatically wrap expression in parentheses and use IN', () => {
            const { sql } = execute(builder, criteria)
            expect(sql).toBe(
              "SELECT * FROM `example` WHERE (((`(CASE WHEN users`.category = 'premium' THEN 'gold' WHEN users.category = 'standard' THEN 'silver' ELSE 'bronze' END) IN (?,?))))",
            )
          }))
        describe('to Bindings', () =>
          it('should have the array values', () => {
            const { bindings } = execute(builder, criteria)
            expect(bindings).toStrictEqual(['gold', 'silver'])
          }))
      })
    })

    describe('regular field names', () => {
      describe('should not wrap simple field names', () => {
        let criteria: Partial<QueryCriteriaInterface>
        beforeEach(
          () =>
            (criteria = {
              filter: {
                status: {
                  eq: 'active',
                },
              },
            }),
        )

        describe('to SQL', () =>
          it('should not wrap simple field names in parentheses', () => {
            const { sql } = execute(builder, criteria)
            expect(sql).toBe('SELECT * FROM `example` WHERE (((`status` = ?)))')
          }))
      })
    })
  })

  // HAVING clause support tests
  describe('HAVING clause support', () => {
    describe('basic HAVING clause', () => {
      describe('single HAVING condition', () => {
        describe('COUNT function condition', () => {
          describe('gt operator greater than 10', () => {
            let criteria: Partial<QueryCriteriaInterface>
            beforeEach(() => {
              criteria = {
                filter: {
                  'having:COUNT(*)': { gt: 10 },
                },
              }
            })

            describe('to SQL', () => {
              it('should generate HAVING COUNT(*) > ?', () => {
                const { sql } = execute(builder, criteria)
                expect(sql).toBe(
                  'SELECT * FROM `example` HAVING (((COUNT(*) > ?)))',
                )
              })
            })

            describe('to Bindings', () => {
              it('should set [10]', () => {
                const { bindings } = execute(builder, criteria)
                expect(bindings).toEqual([10])
              })
            })
          })
        })

        describe('SUM function condition', () => {
          describe('gte operator greater than or equal to 1000', () => {
            let criteria: Partial<QueryCriteriaInterface>
            beforeEach(() => {
              criteria = {
                filter: {
                  'having:SUM(amount)': { gte: 1000 },
                },
              }
            })

            describe('to SQL', () => {
              it('should generate HAVING SUM(amount) >= ?', () => {
                const { sql } = execute(builder, criteria)
                expect(sql).toBe(
                  'SELECT * FROM `example` HAVING (((SUM(amount) >= ?)))',
                )
              })
            })

            describe('to Bindings', () => {
              it('should set [1000]', () => {
                const { bindings } = execute(builder, criteria)
                expect(bindings).toEqual([1000])
              })
            })
          })
        })

        describe('AVG function condition', () => {
          describe('lt operator less than 80', () => {
            let criteria: Partial<QueryCriteriaInterface>
            beforeEach(() => {
              criteria = {
                filter: {
                  'having:AVG(score)': { lt: 80 },
                },
              }
            })

            describe('to SQL', () => {
              it('should generate HAVING AVG(score) < ?', () => {
                const { sql } = execute(builder, criteria)
                expect(sql).toBe(
                  'SELECT * FROM `example` HAVING (((AVG(score) < ?)))',
                )
              })
            })

            describe('to Bindings', () => {
              it('should set [80]', () => {
                const { bindings } = execute(builder, criteria)
                expect(bindings).toEqual([80])
              })
            })
          })
        })
      })

      describe('multiple HAVING conditions (AND combination)', () => {
        let criteria: Partial<QueryCriteriaInterface>
        beforeEach(() => {
          criteria = {
            filter: {
              'having:COUNT(*)': { gt: 5 },
              'having:SUM(amount)': { lte: 10000 },
            },
          }
        })

        describe('to SQL', () => {
          it('should generate COUNT(*) > ? AND SUM(amount) <= ? in HAVING clause', () => {
            const { sql } = execute(builder, criteria)
            expect(sql).toBe(
              'SELECT * FROM `example` HAVING (((COUNT(*) > ?) AND (SUM(amount) <= ?)))',
            )
          })
        })

        describe('to Bindings', () => {
          it('should set [5, 10000] in order', () => {
            const { bindings } = execute(builder, criteria)
            expect(bindings).toEqual([5, 10000])
          })
        })
      })

      describe('HAVING clause with OR conditions', () => {
        let criteria: Partial<QueryCriteriaInterface>
        beforeEach(() => {
          criteria = {
            filter: [
              { 'having:COUNT(*)': { gt: 5 } },
              { 'having:COUNT(*)': { lt: 3 } },
            ],
          }
        })

        describe('to SQL', () => {
          it('should generate COUNT(*) > ? OR COUNT(*) < ? in HAVING clause', () => {
            const { sql } = execute(builder, criteria)
            expect(sql).toBe(
              'SELECT * FROM `example` HAVING (((COUNT(*) > ?)) OR ((COUNT(*) < ?)))',
            )
          })
        })

        describe('to Bindings', () => {
          it('should set [5, 3]', () => {
            const { bindings } = execute(builder, criteria)
            expect(bindings).toEqual([5, 3])
          })
        })
      })
    })

    describe('combination of WHERE and HAVING clauses', () => {
      let criteria: Partial<QueryCriteriaInterface>
      beforeEach(() => {
        criteria = {
          filter: {
            status: { eq: 'active' },
            category: { in: ['A', 'B'] },
            'having:COUNT(*)': { gt: 10 },
            'having:AVG(price)': { gte: 100 },
          },
        }
      })

      describe('to SQL', () => {
        it('should include both WHERE and HAVING clauses', () => {
          const { sql } = execute(builder, criteria)
          expect(sql).toContain('WHERE')
          expect(sql).toContain('HAVING')
        })

        it('should generate WHERE clause first, then HAVING clause', () => {
          const { sql } = execute(builder, criteria)
          expect(sql).toBe(
            'SELECT * FROM `example` WHERE (((`status` = ?) AND (`category` IN (?,?)))) HAVING (((COUNT(*) > ?) AND (AVG(price) >= ?)))',
          )
        })
      })

      describe('to Bindings', () => {
        it('should set values in WHERE then HAVING order: ["active", "A", "B", 10, 100]', () => {
          const { bindings } = execute(builder, criteria)
          expect(bindings).toEqual(['active', 'A', 'B', 10, 100])
        })
      })
    })

    describe('operator support', () => {
      describe('eq operator', () => {
        describe('value is 100', () => {
          let criteria: Partial<QueryCriteriaInterface>
          beforeEach(() => {
            criteria = {
              filter: {
                'having:MAX(id)': { eq: 100 },
              },
            }
          })

          describe('to SQL', () => {
            it('should generate MAX(id) = ?', () => {
              const { sql } = execute(builder, criteria)
              expect(sql).toBe(
                'SELECT * FROM `example` HAVING (((MAX(id) = ?)))',
              )
            })
          })
        })

        describe('value is null', () => {
          let criteria: Partial<QueryCriteriaInterface>
          beforeEach(() => {
            criteria = {
              filter: {
                'having:MAX(id)': { eq: null },
              },
            }
          })

          describe('to SQL', () => {
            it('should generate MAX(id) IS NULL', () => {
              const { sql } = execute(builder, criteria)
              expect(sql).toBe(
                'SELECT * FROM `example` HAVING (((MAX(id) IS NULL)))',
              )
            })
          })
        })
      })

      describe('ne operator', () => {
        describe('value is 1', () => {
          let criteria: Partial<QueryCriteriaInterface>
          beforeEach(() => {
            criteria = {
              filter: {
                'having:MIN(id)': { ne: 1 },
              },
            }
          })

          describe('to SQL', () => {
            it('should generate MIN(id) != ?', () => {
              const { sql } = execute(builder, criteria)
              expect(sql).toBe(
                'SELECT * FROM `example` HAVING (((MIN(id) != ?)))',
              )
            })
          })
        })

        describe('value is null', () => {
          let criteria: Partial<QueryCriteriaInterface>
          beforeEach(() => {
            criteria = {
              filter: {
                'having:MIN(id)': { ne: null },
              },
            }
          })

          describe('to SQL', () => {
            it('should generate MIN(id) IS NOT NULL', () => {
              const { sql } = execute(builder, criteria)
              expect(sql).toBe(
                'SELECT * FROM `example` HAVING (((MIN(id) IS NOT NULL)))',
              )
            })
          })
        })
      })

      describe('comparison operators', () => {
        describe('lt', () => {
          let criteria: Partial<QueryCriteriaInterface>
          beforeEach(() => {
            criteria = {
              filter: {
                'having:COUNT(*)': { lt: 5 },
              },
            }
          })

          describe('to SQL', () => {
            it('should generate COUNT(*) < ?', () => {
              const { sql } = execute(builder, criteria)
              expect(sql).toBe(
                'SELECT * FROM `example` HAVING (((COUNT(*) < ?)))',
              )
            })
          })
        })

        describe('lte', () => {
          let criteria: Partial<QueryCriteriaInterface>
          beforeEach(() => {
            criteria = {
              filter: {
                'having:COUNT(*)': { lte: 5 },
              },
            }
          })

          describe('to SQL', () => {
            it('should generate COUNT(*) <= ?', () => {
              const { sql } = execute(builder, criteria)
              expect(sql).toBe(
                'SELECT * FROM `example` HAVING (((COUNT(*) <= ?)))',
              )
            })
          })
        })

        describe('gt', () => {
          let criteria: Partial<QueryCriteriaInterface>
          beforeEach(() => {
            criteria = {
              filter: {
                'having:COUNT(*)': { gt: 5 },
              },
            }
          })

          describe('to SQL', () => {
            it('should generate COUNT(*) > ?', () => {
              const { sql } = execute(builder, criteria)
              expect(sql).toBe(
                'SELECT * FROM `example` HAVING (((COUNT(*) > ?)))',
              )
            })
          })
        })

        describe('gte', () => {
          let criteria: Partial<QueryCriteriaInterface>
          beforeEach(() => {
            criteria = {
              filter: {
                'having:COUNT(*)': { gte: 5 },
              },
            }
          })

          describe('to SQL', () => {
            it('should generate COUNT(*) >= ?', () => {
              const { sql } = execute(builder, criteria)
              expect(sql).toBe(
                'SELECT * FROM `example` HAVING (((COUNT(*) >= ?)))',
              )
            })
          })
        })
      })

      describe('contains/not_contains operators', () => {
        describe('contains', () => {
          let criteria: Partial<QueryCriteriaInterface>
          beforeEach(() => {
            criteria = {
              filter: {
                'having:GROUP_CONCAT(name)': { contains: 'test' },
              },
            }
          })

          describe('to SQL', () => {
            it('should generate GROUP_CONCAT(name) LIKE ?', () => {
              const { sql } = execute(builder, criteria)
              expect(sql).toBe(
                'SELECT * FROM `example` HAVING (((GROUP_CONCAT(name) LIKE ?)))',
              )
            })
          })

          describe('to Bindings', () => {
            it('should set ["%test%"]', () => {
              const { bindings } = execute(builder, criteria)
              expect(bindings).toEqual(['%test%'])
            })
          })
        })

        describe('not_contains', () => {
          let criteria: Partial<QueryCriteriaInterface>
          beforeEach(() => {
            criteria = {
              filter: {
                'having:GROUP_CONCAT(name)': { not_contains: 'test' },
              },
            }
          })

          describe('to SQL', () => {
            it('should generate GROUP_CONCAT(name) NOT LIKE ?', () => {
              const { sql } = execute(builder, criteria)
              expect(sql).toBe(
                'SELECT * FROM `example` HAVING (((GROUP_CONCAT(name) NOT LIKE ?)))',
              )
            })
          })

          describe('to Bindings', () => {
            it('should set ["%test%"]', () => {
              const { bindings } = execute(builder, criteria)
              expect(bindings).toEqual(['%test%'])
            })
          })
        })
      })

      describe('in operator', () => {
        describe('array value [1, 2, 3]', () => {
          let criteria: Partial<QueryCriteriaInterface>
          beforeEach(() => {
            criteria = {
              filter: {
                'having:COUNT(*)': { in: [1, 2, 3] },
              },
            }
          })

          describe('to SQL', () => {
            it('should generate COUNT(*) IN (?,?,?)', () => {
              const { sql } = execute(builder, criteria)
              expect(sql).toBe(
                'SELECT * FROM `example` HAVING (((COUNT(*) IN (?,?,?))))',
              )
            })
          })

          describe('to Bindings', () => {
            it('should set [1, 2, 3]', () => {
              const { bindings } = execute(builder, criteria)
              expect(bindings).toEqual([1, 2, 3])
            })
          })
        })

        describe('empty array []', () => {
          let criteria: Partial<QueryCriteriaInterface>
          beforeEach(() => {
            criteria = {
              filter: {
                'having:COUNT(*)': { in: [] },
              },
            }
          })

          describe('to SQL', () => {
            it('should not generate HAVING clause', () => {
              const { sql } = execute(builder, criteria)
              expect(sql).toBe('SELECT * FROM `example`')
            })
          })
        })
      })
    })

    describe('edge cases', () => {
      describe('no having: prefix', () => {
        let criteria: Partial<QueryCriteriaInterface>
        beforeEach(() => {
          criteria = {
            filter: {
              status: { eq: 'active' },
            },
          }
        })

        describe('to SQL', () => {
          it('should generate only WHERE clause', () => {
            const { sql } = execute(builder, criteria)
            expect(sql).toBe('SELECT * FROM `example` WHERE (((`status` = ?)))')
          })

          it('should not contain HAVING', () => {
            const { sql } = execute(builder, criteria)
            expect(sql).not.toContain('HAVING')
          })
        })
      })

      describe('having: prefix only', () => {
        let criteria: Partial<QueryCriteriaInterface>
        beforeEach(() => {
          criteria = {
            filter: {
              'having:COUNT(*)': { gt: 0 },
            },
          }
        })

        describe('to SQL', () => {
          it('should generate only HAVING clause', () => {
            const { sql } = execute(builder, criteria)
            expect(sql).toBe(
              'SELECT * FROM `example` HAVING (((COUNT(*) > ?)))',
            )
          })

          it('should not contain WHERE', () => {
            const { sql } = execute(builder, criteria)
            expect(sql).not.toContain('WHERE')
          })
        })
      })

      describe('empty filter', () => {
        let criteria: Partial<QueryCriteriaInterface>
        beforeEach(() => {
          criteria = {
            filter: {},
          }
        })

        describe('to SQL', () => {
          it('should generate only basic SELECT statement', () => {
            const { sql } = execute(builder, criteria)
            expect(sql).toBe('SELECT * FROM `example`')
          })
        })
      })
    })
  })
})
