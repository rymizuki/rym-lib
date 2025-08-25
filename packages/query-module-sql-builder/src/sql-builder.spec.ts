import { buildSQL } from './'

import {
  createBuilder,
  SQLBuilderPort,
} from 'coral-sql'
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
