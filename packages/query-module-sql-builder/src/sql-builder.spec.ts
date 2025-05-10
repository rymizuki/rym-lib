import { buildSQL } from './'

import { createBuilder, SQLBuilderPort } from 'coral-sql'
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

describe('query-module-sql-builder', () => {
  let builder: SQLBuilderPort
  beforeEach(() => {
    builder = createBuilder().from('example')
  })

  // region .filter
  describe('filters', () => {
    describe('given record', () => {
      describe('operators', () => {
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
        })
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
        })
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

    describe.skip('given array', () => {})
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
})
