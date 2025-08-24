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
    describe('基本的なHAVING句', () => {
      describe('単一のHAVING条件', () => {
        describe('COUNT関数での条件', () => {
          describe('gt演算子で10より大きい', () => {
            let criteria: Partial<QueryCriteriaInterface>
            beforeEach(() => {
              criteria = {
                filter: {
                  'having:COUNT(*)': { gt: 10 }
                }
              }
            })

            describe('to SQL', () => {
              it('HAVING COUNT(*) > ? が生成される', () => {
                const { sql } = execute(builder, criteria)
                expect(sql).toBe('SELECT * FROM `example` HAVING (((COUNT(*) > ?)))')
              })
            })

            describe('to Bindings', () => {
              it('[10]が設定される', () => {
                const { bindings } = execute(builder, criteria)
                expect(bindings).toEqual([10])
              })
            })
          })
        })

        describe('SUM関数での条件', () => {
          describe('gte演算子で1000以上', () => {
            let criteria: Partial<QueryCriteriaInterface>
            beforeEach(() => {
              criteria = {
                filter: {
                  'having:SUM(amount)': { gte: 1000 }
                }
              }
            })

            describe('to SQL', () => {
              it('HAVING SUM(amount) >= ? が生成される', () => {
                const { sql } = execute(builder, criteria)
                expect(sql).toBe('SELECT * FROM `example` HAVING (((SUM(amount) >= ?)))')
              })
            })

            describe('to Bindings', () => {
              it('[1000]が設定される', () => {
                const { bindings } = execute(builder, criteria)
                expect(bindings).toEqual([1000])
              })
            })
          })
        })

        describe('AVG関数での条件', () => {
          describe('lt演算子で80未満', () => {
            let criteria: Partial<QueryCriteriaInterface>
            beforeEach(() => {
              criteria = {
                filter: {
                  'having:AVG(score)': { lt: 80 }
                }
              }
            })

            describe('to SQL', () => {
              it('HAVING AVG(score) < ? が生成される', () => {
                const { sql } = execute(builder, criteria)
                expect(sql).toBe('SELECT * FROM `example` HAVING (((AVG(score) < ?)))')
              })
            })

            describe('to Bindings', () => {
              it('[80]が設定される', () => {
                const { bindings } = execute(builder, criteria)
                expect(bindings).toEqual([80])
              })
            })
          })
        })
      })

      describe('複数のHAVING条件（AND結合）', () => {
        let criteria: Partial<QueryCriteriaInterface>
        beforeEach(() => {
          criteria = {
            filter: {
              'having:COUNT(*)': { gt: 5 },
              'having:SUM(amount)': { lte: 10000 }
            }
          }
        })

        describe('to SQL', () => {
          it('COUNT(*) > ? AND SUM(amount) <= ? がHAVING句に生成される', () => {
            const { sql } = execute(builder, criteria)
            expect(sql).toBe('SELECT * FROM `example` HAVING (((COUNT(*) > ?) AND (SUM(amount) <= ?)))')
          })
        })

        describe('to Bindings', () => {
          it('[5, 10000]が順番に設定される', () => {
            const { bindings } = execute(builder, criteria)
            expect(bindings).toEqual([5, 10000])
          })
        })
      })

      describe('OR条件でのHAVING句', () => {
        let criteria: Partial<QueryCriteriaInterface>
        beforeEach(() => {
          criteria = {
            filter: [
              { 'having:COUNT(*)': { gt: 5 } },
              { 'having:COUNT(*)': { lt: 3 } }
            ]
          }
        })

        describe('to SQL', () => {
          it('COUNT(*) > ? OR COUNT(*) < ? がHAVING句に生成される', () => {
            const { sql } = execute(builder, criteria)
            expect(sql).toBe('SELECT * FROM `example` HAVING (((COUNT(*) > ?)) OR ((COUNT(*) < ?)))')
          })
        })

        describe('to Bindings', () => {
          it('[5, 3]が設定される', () => {
            const { bindings } = execute(builder, criteria)
            expect(bindings).toEqual([5, 3])
          })
        })
      })
    })

    describe('WHERE句とHAVING句の組み合わせ', () => {
      let criteria: Partial<QueryCriteriaInterface>
      beforeEach(() => {
        criteria = {
          filter: {
            status: { eq: 'active' },
            category: { in: ['A', 'B'] },
            'having:COUNT(*)': { gt: 10 },
            'having:AVG(price)': { gte: 100 }
          }
        }
      })

      describe('to SQL', () => {
        it('WHERE句とHAVING句が両方含まれる', () => {
          const { sql } = execute(builder, criteria)
          expect(sql).toContain('WHERE')
          expect(sql).toContain('HAVING')
        })

        it('WHERE句が先、HAVING句が後の順序で生成される', () => {
          const { sql } = execute(builder, criteria)
          expect(sql).toBe('SELECT * FROM `example` WHERE (((`status` = ?) AND (`category` IN (?,?)))) HAVING (((COUNT(*) > ?) AND (AVG(price) >= ?)))')
        })
      })

      describe('to Bindings', () => {
        it('[\'active\', \'A\', \'B\', 10, 100]がWHERE句、HAVING句の順で設定される', () => {
          const { bindings } = execute(builder, criteria)
          expect(bindings).toEqual(['active', 'A', 'B', 10, 100])
        })
      })
    })

    describe('各オペレーターのサポート', () => {
      describe('eq オペレーター', () => {
        describe('値が100', () => {
          let criteria: Partial<QueryCriteriaInterface>
          beforeEach(() => {
            criteria = {
              filter: {
                'having:MAX(id)': { eq: 100 }
              }
            }
          })

          describe('to SQL', () => {
            it('MAX(id) = ? が生成される', () => {
              const { sql } = execute(builder, criteria)
              expect(sql).toBe('SELECT * FROM `example` HAVING (((MAX(id) = ?)))')
            })
          })
        })

        describe('値がnull', () => {
          let criteria: Partial<QueryCriteriaInterface>
          beforeEach(() => {
            criteria = {
              filter: {
                'having:MAX(id)': { eq: null }
              }
            }
          })

          describe('to SQL', () => {
            it('MAX(id) IS NULL が生成される', () => {
              const { sql } = execute(builder, criteria)
              expect(sql).toBe('SELECT * FROM `example` HAVING (((MAX(id) IS NULL)))')
            })
          })
        })
      })

      describe('ne オペレーター', () => {
        describe('値が1', () => {
          let criteria: Partial<QueryCriteriaInterface>
          beforeEach(() => {
            criteria = {
              filter: {
                'having:MIN(id)': { ne: 1 }
              }
            }
          })

          describe('to SQL', () => {
            it('MIN(id) != ? が生成される', () => {
              const { sql } = execute(builder, criteria)
              expect(sql).toBe('SELECT * FROM `example` HAVING (((MIN(id) != ?)))')
            })
          })
        })

        describe('値がnull', () => {
          let criteria: Partial<QueryCriteriaInterface>
          beforeEach(() => {
            criteria = {
              filter: {
                'having:MIN(id)': { ne: null }
              }
            }
          })

          describe('to SQL', () => {
            it('MIN(id) IS NOT NULL が生成される', () => {
              const { sql } = execute(builder, criteria)
              expect(sql).toBe('SELECT * FROM `example` HAVING (((MIN(id) IS NOT NULL)))')
            })
          })
        })
      })

      describe('比較オペレーター', () => {
        describe('lt', () => {
          let criteria: Partial<QueryCriteriaInterface>
          beforeEach(() => {
            criteria = {
              filter: {
                'having:COUNT(*)': { lt: 5 }
              }
            }
          })

          describe('to SQL', () => {
            it('COUNT(*) < ? が生成される', () => {
              const { sql } = execute(builder, criteria)
              expect(sql).toBe('SELECT * FROM `example` HAVING (((COUNT(*) < ?)))')
            })
          })
        })

        describe('lte', () => {
          let criteria: Partial<QueryCriteriaInterface>
          beforeEach(() => {
            criteria = {
              filter: {
                'having:COUNT(*)': { lte: 5 }
              }
            }
          })

          describe('to SQL', () => {
            it('COUNT(*) <= ? が生成される', () => {
              const { sql } = execute(builder, criteria)
              expect(sql).toBe('SELECT * FROM `example` HAVING (((COUNT(*) <= ?)))')
            })
          })
        })

        describe('gt', () => {
          let criteria: Partial<QueryCriteriaInterface>
          beforeEach(() => {
            criteria = {
              filter: {
                'having:COUNT(*)': { gt: 5 }
              }
            }
          })

          describe('to SQL', () => {
            it('COUNT(*) > ? が生成される', () => {
              const { sql } = execute(builder, criteria)
              expect(sql).toBe('SELECT * FROM `example` HAVING (((COUNT(*) > ?)))')
            })
          })
        })

        describe('gte', () => {
          let criteria: Partial<QueryCriteriaInterface>
          beforeEach(() => {
            criteria = {
              filter: {
                'having:COUNT(*)': { gte: 5 }
              }
            }
          })

          describe('to SQL', () => {
            it('COUNT(*) >= ? が生成される', () => {
              const { sql } = execute(builder, criteria)
              expect(sql).toBe('SELECT * FROM `example` HAVING (((COUNT(*) >= ?)))')
            })
          })
        })
      })

      describe('contains/not_contains オペレーター', () => {
        describe('contains', () => {
          let criteria: Partial<QueryCriteriaInterface>
          beforeEach(() => {
            criteria = {
              filter: {
                'having:GROUP_CONCAT(name)': { contains: 'test' }
              }
            }
          })

          describe('to SQL', () => {
            it('GROUP_CONCAT(name) LIKE ? が生成される', () => {
              const { sql } = execute(builder, criteria)
              expect(sql).toBe('SELECT * FROM `example` HAVING (((GROUP_CONCAT(name) LIKE ?)))')
            })
          })

          describe('to Bindings', () => {
            it('[\'%test%\']が設定される', () => {
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
                'having:GROUP_CONCAT(name)': { not_contains: 'test' }
              }
            }
          })

          describe('to SQL', () => {
            it('GROUP_CONCAT(name) NOT LIKE ? が生成される', () => {
              const { sql } = execute(builder, criteria)
              expect(sql).toBe('SELECT * FROM `example` HAVING (((GROUP_CONCAT(name) NOT LIKE ?)))')
            })
          })

          describe('to Bindings', () => {
            it('[\'%test%\']が設定される', () => {
              const { bindings } = execute(builder, criteria)
              expect(bindings).toEqual(['%test%'])
            })
          })
        })
      })

      describe('in オペレーター', () => {
        describe('配列値[1, 2, 3]', () => {
          let criteria: Partial<QueryCriteriaInterface>
          beforeEach(() => {
            criteria = {
              filter: {
                'having:COUNT(*)': { in: [1, 2, 3] }
              }
            }
          })

          describe('to SQL', () => {
            it('COUNT(*) IN (?,?,?) が生成される', () => {
              const { sql } = execute(builder, criteria)
              expect(sql).toBe('SELECT * FROM `example` HAVING (((COUNT(*) IN (?,?,?))))')
            })
          })

          describe('to Bindings', () => {
            it('[1, 2, 3]が設定される', () => {
              const { bindings } = execute(builder, criteria)
              expect(bindings).toEqual([1, 2, 3])
            })
          })
        })

        describe('空配列[]', () => {
          let criteria: Partial<QueryCriteriaInterface>
          beforeEach(() => {
            criteria = {
              filter: {
                'having:COUNT(*)': { in: [] }
              }
            }
          })

          describe('to SQL', () => {
            it('HAVING句が生成されない', () => {
              const { sql } = execute(builder, criteria)
              expect(sql).toBe('SELECT * FROM `example`')
            })
          })
        })
      })
    })


    describe('エッジケース', () => {
      describe('having:プレフィックスなし', () => {
        let criteria: Partial<QueryCriteriaInterface>
        beforeEach(() => {
          criteria = {
            filter: {
              status: { eq: 'active' }
            }
          }
        })

        describe('to SQL', () => {
          it('WHERE句のみが生成される', () => {
            const { sql } = execute(builder, criteria)
            expect(sql).toBe('SELECT * FROM `example` WHERE (((`status` = ?)))')
          })

          it('HAVINGが含まれない', () => {
            const { sql } = execute(builder, criteria)
            expect(sql).not.toContain('HAVING')
          })
        })
      })

      describe('having:プレフィックスのみ', () => {
        let criteria: Partial<QueryCriteriaInterface>
        beforeEach(() => {
          criteria = {
            filter: {
              'having:COUNT(*)': { gt: 0 }
            }
          }
        })

        describe('to SQL', () => {
          it('HAVING句のみが生成される', () => {
            const { sql } = execute(builder, criteria)
            expect(sql).toBe('SELECT * FROM `example` HAVING (((COUNT(*) > ?)))')
          })

          it('WHEREが含まれない', () => {
            const { sql } = execute(builder, criteria)
            expect(sql).not.toContain('WHERE')
          })
        })
      })

      describe('空のフィルター', () => {
        let criteria: Partial<QueryCriteriaInterface>
        beforeEach(() => {
          criteria = {
            filter: {}
          }
        })

        describe('to SQL', () => {
          it('基本のSELECT文のみが生成される', () => {
            const { sql } = execute(builder, criteria)
            expect(sql).toBe('SELECT * FROM `example`')
          })
        })
      })
    })
  })
})
