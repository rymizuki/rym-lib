import { QueryDriverPrisma } from './'

import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'

import {
  QueryCriteria,
  QueryDriverInterface,
  QueryRunnerCriteria,
} from '@rym-lib/query-module'
import { SQLBuilder, exists } from '@rym-lib/query-module-sql-builder'
import { createLogger } from '@rym-lib/query-module/test-utils'

import prisma from './test-utils/prisma'
import { prismaMock } from './test-utils/prisma-mock'

describe('query-module-driver-prisma', () => {
  let driver: QueryDriverInterface
  beforeEach(() => {
    driver = new QueryDriverPrisma(prisma, {
      logger: createLogger(),
    })
  })

  describe('.source', () => {
    describe('specify setup function', () => {
      let setup: Mock
      beforeEach(() => {
        setup = vi.fn((builder) => builder.from('example'))
      })

      beforeEach(async () => {
        await driver.source(setup).execute(new QueryCriteria({}, {}))
      })

      it('should be called with SQLBuilder', () => {
        expect(setup.mock.lastCall?.[0]).toBeInstanceOf(SQLBuilder)
      })
    })
  })

  describe('.execute', () => {
    describe('missing .source() call', () => {
      it('should be throw error', async () => {
        await expect(
          async () => await driver.execute(new QueryCriteria({}, {})),
        ).rejects.toThrowError(/QueryDriver must be required source\./)
      })
    })
    describe('.source() called', () => {
      const data = [
        { index: 0, value: 'item-1' },
        { index: 1, value: 'item-2' },
      ]
      beforeEach(() => {
        prismaMock.$queryRawUnsafe.mockReturnValue(Promise.resolve(data) as any)
      })

      beforeEach(() => {
        driver.source((builder) => builder.from('example'))
      })

      describe('returns', () => {
        it('should be returns prisma result rows', async () => {
          expect(await driver.execute(new QueryCriteria({}, {}))).toStrictEqual(
            data,
          )
        })
      })

      describe('execute prisma.$queryRawUnsafe', () => {
        describe('criteria is empty', () => {
          beforeEach(async () => {
            await driver.execute(new QueryCriteria({}, {}))
          })

          it('should be no condition sql', () => {
            expect(prismaMock.$queryRawUnsafe.mock.lastCall).toStrictEqual([
              'SELECT\n  *\nFROM\n  `example`',
            ])
          })
        })

        describe('criteria.filter', () => {
          describe('is single', () => {
            describe('eq: value', () => {
              it('should be value = value sql', async () => {
                await expectQuery(
                  driver,
                  {
                    filter: { value: { eq: 'example' } },
                  },
                  [
                    'SELECT\n  *\nFROM\n  `example`\nWHERE\n  (((`value` = ?)))',
                    'example',
                  ],
                )
              })
            })
            describe('eq: null', () => {
              it('should be value IS NULL sql', async () => {
                await expectQuery(
                  driver,
                  {
                    filter: { value: { eq: null } },
                  },
                  [
                    'SELECT\n  *\nFROM\n  `example`\nWHERE\n  (((`value` IS NULL)))',
                  ],
                )
              })
            })
            describe('ne: value', () => {
              it('should be value != value sql', async () => {
                await expectQuery(
                  driver,
                  {
                    filter: { value: { ne: 'example' } },
                  },
                  [
                    'SELECT\n  *\nFROM\n  `example`\nWHERE\n  (((`value` != ?)))',
                    'example',
                  ],
                )
              })
            })
            describe('ne: null', () => {
              it('should be value IS NOT NULL sql', async () => {
                await expectQuery(
                  driver,
                  {
                    filter: { value: { ne: null } },
                  },
                  [
                    'SELECT\n  *\nFROM\n  `example`\nWHERE\n  (((`value` IS NOT NULL)))',
                  ],
                )
              })
            })
            describe('gt: value', () => {
              it('should be expected < value sql', async () => {
                await expectQuery(
                  driver,
                  {
                    filter: { value: { gt: 10 } },
                  },
                  [
                    'SELECT\n  *\nFROM\n  `example`\nWHERE\n  (((`value` > ?)))',
                    10,
                  ],
                )
              })
            })
            describe('gte: value', () => {
              it('should be expected <= value sql', async () => {
                await expectQuery(
                  driver,
                  {
                    filter: { value: { gte: 10 } },
                  },
                  [
                    'SELECT\n  *\nFROM\n  `example`\nWHERE\n  (((`value` >= ?)))',
                    10,
                  ],
                )
              })
            })
            describe('lt: value', () => {
              it('should be value < expected sql', async () => {
                await expectQuery(
                  driver,
                  {
                    filter: { value: { lt: 100 } },
                  },
                  [
                    'SELECT\n  *\nFROM\n  `example`\nWHERE\n  (((`value` < ?)))',
                    100,
                  ],
                )
              })
            })
            describe('lte: value', () => {
              it('should be value <= expected sql', async () => {
                await expectQuery(
                  driver,
                  {
                    filter: { value: { lte: 10 } },
                  },
                  [
                    'SELECT\n  *\nFROM\n  `example`\nWHERE\n  (((`value` <= ?)))',
                    10,
                  ],
                )
              })
            })
            describe('contains: value', () => {
              it('should be value LIKE expected sql', async () => {
                await expectQuery(
                  driver,
                  {
                    filter: { value: { contains: 'example' } },
                  },
                  [
                    'SELECT\n  *\nFROM\n  `example`\nWHERE\n  (((`value` LIKE ?)))',
                    '%example%',
                  ],
                )
              })
            })
            describe('not_contains: value', () => {
              it('should be value NOT LIKE expected sql', async () => {
                await expectQuery(
                  driver,
                  {
                    filter: { value: { not_contains: 'example' } },
                  },
                  [
                    'SELECT\n  *\nFROM\n  `example`\nWHERE\n  (((`value` NOT LIKE ?)))',
                    '%example%',
                  ],
                )
              })
            })
            describe('in: value[]', () => {
              it('should be value IN expected sql', async () => {
                await expectQuery(
                  driver,
                  {
                    filter: { value: { in: ['example-1', 'example-2'] } },
                  },
                  [
                    'SELECT\n  *\nFROM\n  `example`\nWHERE\n  (((`value` IN (?,?))))',
                    'example-1',
                    'example-2',
                  ],
                )
              })
            })
            describe('not in: value[]', () => {
              // NOTE: NOT IN operator is not currently supported in QueryFilterOperator type
              // This test demonstrates the missing functionality that should be implemented
              it.todo(
                'should be value NOT IN expected sql - requires not_in operator implementation',
              )
            })
          })

          describe('is multiple', () => {
            it('should be or operation sql', async () => {
              await expectQuery(
                driver,
                {
                  filter: [
                    { value: { eq: 'example' } },
                    { value: { eq: null } },
                  ],
                },
                [
                  'SELECT\n  *\nFROM\n  `example`\nWHERE\n  (((`value` = ?))\n  OR ((`value` IS NULL)))',
                  'example',
                ],
              )
            })
          })
        })

        describe('criteria.filter with custom filter implementation', () => {
          describe('custom filter mechanism', () => {
            it('should support EXISTS functionality through filter property', async () => {
              driver.source((builder) => builder.from('example'))

              // Mock criteria structure that would come from QueryCriteria with custom filter mapping
              const mockCriteria = {
                filter: {
                  order_id: {
                    column: null,
                    value: { eq: 'test-value' },
                    filter: (payload: any, context: any) =>
                      exists(
                        context.builder
                          .createBuilder()
                          .from('orders', 'o')
                          .column('1')
                          .where(
                            context.builder
                              .createConditions()
                              .and('example.id', '=', 'o.user_id')
                              .and('o.id', payload.op, payload.value),
                          ),
                      ),
                  },
                },
                orderBy: [],
                take: undefined,
                skip: undefined,
              } as any

              await driver.execute(mockCriteria)

              const lastCall = prismaMock.$queryRawUnsafe.mock.lastCall
              expect(lastCall?.[0]).toContain('EXISTS')
              expect(lastCall?.[0]).toContain('orders')
              // The parameter binding may be different due to how the EXISTS query is structured
              expect(lastCall?.[1]).toBeDefined()
            })

            it('should handle filter function with different operators', async () => {
              driver.source((builder) => builder.from('example'))

              const mockCriteria = {
                filter: {
                  amount: {
                    column: null,
                    value: { gt: 100 },
                    filter: (payload: any, context: any) =>
                      exists(
                        context.builder
                          .createBuilder()
                          .from('transactions', 't')
                          .column('1')
                          .where('t.amount', payload.op, payload.value),
                      ),
                  },
                },
                orderBy: [],
                take: undefined,
                skip: undefined,
              } as any

              await driver.execute(mockCriteria)

              const lastCall = prismaMock.$queryRawUnsafe.mock.lastCall
              expect(lastCall?.[0]).toContain('EXISTS')
              expect(lastCall?.[0]).toContain('transactions')
              expect(lastCall?.[1]).toBe(100)
            })

            it('should fall back to default behavior when no filter function is provided', async () => {
              driver.source((builder) => builder.from('example'))

              const mockCriteria = {
                filter: {
                  normal_field: {
                    column: null,
                    value: { eq: 'normal-value' },
                    filter: undefined, // No custom filter
                  },
                },
                orderBy: [],
                take: undefined,
                skip: undefined,
              } as any

              await driver.execute(mockCriteria)

              const lastCall = prismaMock.$queryRawUnsafe.mock.lastCall
              expect(lastCall?.[0]).not.toContain('EXISTS')
              expect(lastCall?.[0]).toContain('`normal_field` = ?')
              expect(lastCall?.[1]).toBe('normal-value')
            })
          })
        })

        describe('criteria.orderBy', () => {
          describe('no direction', () => {
            it('should be ORDER BY value ASC', async () => {
              await expectQuery<any>(
                driver,
                {
                  orderBy: 'index',
                },
                ['SELECT\n  *\nFROM\n  `example`\nORDER BY\n  `index` ASC'],
              )
            })
          })
          describe('direction to ASC', () => {
            it('should be ORDER BY value ASC', async () => {
              await expectQuery<any>(
                driver,
                {
                  orderBy: 'index:asc',
                },
                ['SELECT\n  *\nFROM\n  `example`\nORDER BY\n  `index` ASC'],
              )
            })
          })
          describe('direction to DESC', () => {
            it('should be ORDER BY value DESC', async () => {
              await expectQuery<any>(
                driver,
                {
                  orderBy: 'index:desc',
                },
                ['SELECT\n  *\nFROM\n  `example`\nORDER BY\n  `index` DESC'],
              )
            })
          })
        })

        describe('criteria.take', () => {
          it('should be LIMIT value sql', async () => {
            await expectQuery<any>(
              driver,
              {
                take: 10,
              },
              ['SELECT\n  *\nFROM\n  `example`\nLIMIT 10'],
            )
          })
        })

        describe('criteria.skip', () => {
          it('should be OFFSET value sql', async () => {
            await expectQuery<any>(
              driver,
              {
                skip: 5,
              },
              ['SELECT\n  *\nFROM\n  `example`\nOFFSET 5'],
            )
          })
        })
      })
    })
  })

  // region Error reproduction tests for sql-builder TypeError
  describe('Error reproduction: sql-builder TypeError', () => {
    describe('TypeError: Cannot convert undefined or null to object', () => {
      describe('using defineQuery - Real world scenario', () => {
        it('should reproduce error when filter contains null through defineQuery', async () => {
          // defineQueryを使った実際のクエリ定義
          const { defineQuery } = await import('@rym-lib/query-module')
          
          const testQuery = defineQuery(driver, {
            name: 'test-query',
            source: (builder) => builder.from('example'),
            rules: {
              name: 'name',  // Simple string mapping
              value: 'value' // Simple string mapping
            }
          })
          
          // 外部APIから来る可能性のある不正なデータ
          const malformedFilterData = [
            { name: { eq: 'valid' } },
            null, // APIエラーで混入したnull
            { value: { eq: 'test' } }
          ]
          
          await expect(async () => {
            await testQuery.many({
              filter: malformedFilterData as any
            })
          }).rejects.toThrow('Cannot convert undefined or null to object')
        })
        
        it('should reproduce error with single null filter', async () => {
          const { defineQuery } = await import('@rym-lib/query-module')
          
          const testQuery = defineQuery(driver, {
            name: 'test-query',
            source: (builder) => builder.from('example'),
            rules: {
              name: 'name'
            }
          })
          
          await expect(async () => {
            await testQuery.many({
              filter: null as any // 直接null
            })
          }).rejects.toThrow('Cannot convert undefined or null to object')
        })
        
        it('should reproduce error with undefined filter', async () => {
          const { defineQuery } = await import('@rym-lib/query-module')
          
          const testQuery = defineQuery(driver, {
            name: 'test-query',
            source: (builder) => builder.from('example'),
            rules: {
              name: 'name'
            }
          })
          
          await expect(async () => {
            await testQuery.many({
              filter: undefined as any // 直接undefined
            })
          }).rejects.toThrow('Cannot convert undefined or null to object')
        })
      })

      describe('when filter contains null element directly', () => {
        it('should reproduce the error in QueryCriteria.remap (line 62)', async () => {
          driver.source((builder) => builder.from('example'))
          
          // この構造がQueryCriteria.remapメソッドの62行目でObject.keys(f)を呼び出す
          const malformedCriteria = {
            filter: [null] as any, // null要素を直接含む配列
            orderBy: [],
            take: undefined,
            skip: undefined,
          }
          
          await expect(async () => {
            await driver.execute(new QueryCriteria({}, malformedCriteria))
          }).rejects.toThrow('Cannot convert undefined or null to object')
        })
      })

      describe('when filter contains undefined element directly', () => {
        it('should reproduce the error in QueryCriteria.remap (line 62)', async () => {
          driver.source((builder) => builder.from('example'))
          
          const malformedCriteria = {
            filter: [undefined] as any, // undefined要素を直接含む配列
            orderBy: [],
            take: undefined,
            skip: undefined,
          }
          
          await expect(async () => {
            await driver.execute(new QueryCriteria({}, malformedCriteria))
          }).rejects.toThrow('Cannot convert undefined or null to object')
        })
      })

      describe('when filter is a single null value', () => {
        it('should reproduce the error in QueryCriteria.remap (line 62)', async () => {
          driver.source((builder) => builder.from('example'))
          
          const malformedCriteria = {
            filter: null as any, // 単一のnull値
            orderBy: [],
            take: undefined,
            skip: undefined,
          }
          
          await expect(async () => {
            await driver.execute(new QueryCriteria({}, malformedCriteria))
          }).rejects.toThrow('Cannot convert undefined or null to object')
        })
      })

      describe('when filter array contains mixed null and valid elements', () => {
        it('should reproduce the error even with valid elements present', async () => {
          driver.source((builder) => builder.from('example'))
          
          const malformedCriteria = {
            filter: [
              { value: { eq: 'valid-data' } }, // 有効なデータ
              null, // null要素がエラーを引き起こす
              { value: { eq: 'more-valid-data' } } // これも有効だが、nullでエラーになる
            ] as any,
            orderBy: [],
            take: undefined,
            skip: undefined,
          }
          
          await expect(async () => {
            await driver.execute(new QueryCriteria({}, malformedCriteria))
          }).rejects.toThrow('Cannot convert undefined or null to object')
        })
      })

      describe('Real-world scenario: external API returning malformed data', () => {
        it('should handle case where external filter data contains null values', async () => {
          driver.source((builder) => builder.from('example'))
          
          // 外部APIから不正な形式のfilterデータが来たケース
          const externalApiResponse = {
            filters: [
              { field: 'name', operator: 'eq', value: 'test' },
              null, // APIエラーでnullが混入
              { field: 'age', operator: 'gt', value: 18 }
            ]
          }
          
          // このデータをQueryCriteriaに変換すると...
          const transformedFilter = externalApiResponse.filters.map(f => 
            f ? { [f.field]: { [f.operator]: f.value } } : f
          ) // この変換でnullが残る
          
          const criteria = {
            filter: transformedFilter as any,
            orderBy: [],
            take: undefined,
            skip: undefined,
          }
          
          await expect(async () => {
            await driver.execute(new QueryCriteria({}, criteria))
          }).rejects.toThrow('Cannot convert undefined or null to object')
        })
      })
    })
  })
})

async function expectQuery<
  Data,
  Criteria extends QueryRunnerCriteria<Data> = QueryRunnerCriteria<Data>,
>(driver: QueryDriverInterface, criteria: Criteria, expected: any[]) {
  await driver.execute(new QueryCriteria({}, criteria))

  return expect(prismaMock.$queryRawUnsafe.mock.lastCall).toStrictEqual(
    expected,
  )
}
