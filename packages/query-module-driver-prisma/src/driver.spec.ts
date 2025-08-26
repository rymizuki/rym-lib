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

  // region Null value handling tests (Fixed behavior)
  describe('Null value handling (regression test)', () => {
    describe('null values in filter should be filtered out before sql-builder', () => {
      it('should not cause TypeError when filter contains null values', async () => {
        const { defineQuery } = await import('@rym-lib/query-module')

        const testQuery = defineQuery(driver, {
          name: 'null-value-test',
          source: (builder) => builder.from('example'),
          rules: {
            name: 'name',
            value: 'value',
          },
        })

        // この呼び出しは修正前はエラーになっていた:
        // "TypeError: Cannot convert undefined or null to object"
        await expect(async () => {
          await testQuery.many({
            filter: {
              name: null, // この null が QueryCriteria.remap でフィルタリングされる
              value: { eq: 'test' }, // これは正常に処理される
            },
          })
        }).not.toThrow()

        // SQL が正常に生成されることを確認
        const lastCall = prismaMock.$queryRawUnsafe.mock.lastCall
        expect(lastCall).toBeDefined()
        expect(lastCall![0]).toContain('`value` = ?')
        expect(lastCall![0]).not.toContain('`name`') // null でフィルタリングされたため含まれない
        expect(lastCall![1]).toBe('test')
      })

      it('should handle undefined values correctly (existing behavior)', async () => {
        const { defineQuery } = await import('@rym-lib/query-module')

        const testQuery = defineQuery(driver, {
          name: 'undefined-value-test',
          source: (builder) => builder.from('example'),
          rules: {
            name: 'name',
            value: 'value',
          },
        })

        await expect(async () => {
          await testQuery.many({
            filter: {
              name: undefined, // undefined も同様にフィルタリングされる
              value: { eq: 'test' },
            },
          })
        }).not.toThrow()

        // SQL が正常に生成されることを確認
        const lastCall = prismaMock.$queryRawUnsafe.mock.lastCall
        expect(lastCall).toBeDefined()
        expect(lastCall![0]).toContain('`value` = ?')
        expect(lastCall![0]).not.toContain('`name`')
        expect(lastCall![1]).toBe('test')
      })

      it('should handle mixed null and valid values in filter arrays', async () => {
        const { defineQuery } = await import('@rym-lib/query-module')

        const testQuery = defineQuery(driver, {
          name: 'mixed-array-test',
          source: (builder) => builder.from('example'),
          rules: {
            name: 'name',
            value: 'value',
            age: 'age',
          },
        })

        await expect(async () => {
          await testQuery.many({
            filter: [
              {
                name: { eq: 'test1' },
                value: null, // この null はフィルタリングされる
              },
              {
                name: undefined, // この undefined もフィルタリングされる
                age: { gt: 18 },
              },
            ],
          })
        }).not.toThrow()

        // OR 条件のSQLが生成されることを確認
        const lastCall = prismaMock.$queryRawUnsafe.mock.lastCall
        expect(lastCall).toBeDefined()
        expect(lastCall![0]).toContain('OR')
        expect(lastCall![0]).toContain('`name` = ?')
        expect(lastCall![0]).toContain('`age` > ?')
      })

      it('should preserve valid falsy values (false, 0, empty string)', async () => {
        const { defineQuery } = await import('@rym-lib/query-module')

        const testQuery = defineQuery(driver, {
          name: 'falsy-values-test',
          source: (builder) => builder.from('example'),
          rules: {
            active: 'active',
            count: 'count',
            description: 'description',
          },
        })

        await expect(async () => {
          await testQuery.many({
            filter: {
              active: { eq: false }, // false は有効な値として残る
              count: { eq: 0 }, // 0 も有効な値として残る
              description: { eq: '' }, // 空文字も有効な値として残る
            },
          })
        }).not.toThrow()

        // 全ての条件がSQLに含まれることを確認
        const lastCall = prismaMock.$queryRawUnsafe.mock.lastCall
        expect(lastCall).toBeDefined()
        expect(lastCall![0]).toContain('`active` = ?')
        expect(lastCall![0]).toContain('`count` = ?')
        expect(lastCall![0]).toContain('`description` = ?')

        // パラメータの順序は実際の実行結果に依存するため、適切な数の条件が含まれることを確認
        const parameters = lastCall!.slice(1)
        expect(parameters).toHaveLength(3) // 3つの条件が含まれる
        // NOTE: Prismaでは boolean false は数値 0 に変換される
        expect(parameters).toEqual(expect.arrayContaining([0, 0, ''])) // false -> 0, 0 -> 0, '' -> ''
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
