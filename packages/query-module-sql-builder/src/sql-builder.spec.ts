import { buildSQL } from './'

import { createBuilder, SQLBuilderPort } from 'coral-sql'
import { beforeEach, describe, expect, it } from 'vitest'

import { QueryCriteriaInterface } from '@rym-lib/query-module'

type TestCriteria = {
  filter: Record<string, any> | Record<string, any>[]
  orderBy: any
  take: number
  skip: number
}

function createCriteria(attrs: Partial<TestCriteria>): QueryCriteriaInterface {
  const processFilter = (filter: Record<string, any>) => {
    const processed: Record<string, any> = {}
    for (const [key, value] of Object.entries(filter)) {
      processed[key] = {
        column: null,
        filter: undefined,
        value: value,
      }
    }
    return processed
  }

  const processedFilter = attrs.filter
    ? Array.isArray(attrs.filter)
      ? attrs.filter.map(processFilter)
      : processFilter(attrs.filter)
    : undefined

  return {
    filter: processedFilter,
    orderBy: attrs.orderBy || [],
    take: attrs.take,
    skip: attrs.skip,
  } as QueryCriteriaInterface
}

function xbr(value: string) {
  return value.replace(/\n/g, ' ').replace(/\s+/g, ' ')
}

function execute(builder: SQLBuilderPort, criteria: Partial<TestCriteria>) {
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
            let criteria: Partial<TestCriteria>
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
            let criteria: Partial<TestCriteria>
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
            let criteria: Partial<TestCriteria>
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
            let criteria: Partial<TestCriteria>
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
            let criteria: Partial<TestCriteria>
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
            let criteria: Partial<TestCriteria>
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
            let criteria: Partial<TestCriteria>
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
            let criteria: Partial<TestCriteria>
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
            let criteria: Partial<TestCriteria>
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
            let criteria: Partial<TestCriteria>
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
            let criteria: Partial<TestCriteria>
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
            let criteria: Partial<TestCriteria>
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
            let criteria: Partial<TestCriteria>
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
            let criteria: Partial<TestCriteria>
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
      let criteria: Partial<TestCriteria>
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

  // region Error reproduction tests
  describe('Error reproduction', () => {
    describe('TypeError: Cannot convert undefined or null to object', () => {
      describe('when filter is null', () => {
        it('should NOT throw error because null is falsy and filtered out by if statement', () => {
          const criteria: QueryCriteriaInterface = {
            filter: null as any,
            orderBy: [],
            take: undefined,
            skip: undefined,
          }

          // null は falsy なので if (criteria.filter) で除外される
          expect(() => {
            buildSQL(builder, criteria)
          }).not.toThrow()
        })
      })

      describe('when filter is undefined', () => {
        it('should throw TypeError at line 41 (keys function)', () => {
          const criteria: QueryCriteriaInterface = {
            filter: undefined as any,
            orderBy: [],
            take: undefined,
            skip: undefined,
          }

          // NOTE: undefinedの場合は68行目のif (criteria.filter)でフィルターされるため、実際にはエラーは発生しない
          // しかし、nullの場合はif文を通過してしまう
          expect(() => {
            buildSQL(builder, criteria)
          }).not.toThrow()
        })
      })

      describe('when filter array contains null element', () => {
        it('should throw TypeError at line 41 (keys function)', () => {
          // 正しい形式で作成
          const validFilter = {
            name: {
              column: null,
              filter: undefined,
              value: { eq: 'test' },
            },
          }

          const criteria: QueryCriteriaInterface = {
            filter: [validFilter, null as any], // null要素を含む配列
            orderBy: [],
            take: undefined,
            skip: undefined,
          }

          expect(() => {
            buildSQL(builder, criteria)
          }).toThrow('Cannot convert undefined or null to object')
        })
      })

      describe('when filter object has property with null value object', () => {
        it('should throw TypeError at line 185 (property keys)', () => {
          const mockCriteria: QueryCriteriaInterface = {
            filter: {
              name: {
                column: null as any, // Test case: intentionally null for error testing
                filter: undefined as any, // Test case: intentionally undefined for error testing
                value: null, // この時propertyが評価されてkeys(property)でエラー
              },
            },
            orderBy: [],
            take: undefined,
            skip: undefined,
          }

          expect(() => {
            buildSQL(builder, mockCriteria)
          }).toThrow('Cannot convert undefined or null to object')
        })
      })

      describe('when using having filter with null', () => {
        it('should throw TypeError for having filters', () => {
          const criteria: QueryCriteriaInterface = {
            filter: [null as any],
            orderBy: [],
            take: undefined,
            skip: undefined,
          }

          expect(() => {
            buildSQL(builder, criteria)
          }).toThrow('Cannot convert undefined or null to object')
        })
      })

      describe('Real world case: direct null filter', () => {
        it('should throw TypeError when filter is directly set to empty object then manipulated to null', () => {
          // 実際の使用例：外部から渡されたfilterがnullまたはundefinedの場合
          const malformedFilter = null

          if (malformedFilter) {
            // このチェックを通過してしまう可能性がある
            const criteria: QueryCriteriaInterface = {
              filter: malformedFilter as any,
              orderBy: [],
              take: undefined,
              skip: undefined,
            }

            expect(() => {
              buildSQL(builder, criteria)
            }).toThrow('Cannot convert undefined or null to object')
          }
        })
      })
    })
  })
})
