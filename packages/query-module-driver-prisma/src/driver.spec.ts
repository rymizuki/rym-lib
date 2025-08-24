import { QueryDriverPrisma } from './'

import { SQLBuilder } from 'coral-sql'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'

import {
  QueryCriteria,
  QueryDriverInterface,
  QueryRunnerCriteria,
} from '@rym-lib/query-module'
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
              it('should be value NOT LIKE expected sql', async () => {
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
            describe.skip('not in: value[]', () => {})
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
})

describe('function-based rules support', () => {
  describe('integration with coral-sql SQLBuilder', () => {
    let driver: QueryDriverInterface
    
    beforeEach(() => {
      driver = new QueryDriverPrisma(prisma, {
        logger: createLogger(),
      })
    })

    it('should support function-based rules that use SQLBuilder methods', async () => {
      const sourceFunction = (builder: SQLBuilder) => {
        return builder
          .from('users', 'u')
          .leftJoin('user_profiles', 'p', 'u.id = p.user_id')
          .column('u.id')
          .column('u.name')
          .column('u.email')
      }

      // Test function-based rules that generate dynamic SQL expressions
      const rules = {
        id: 'u.id',
        name: 'u.name', 
        // Function-based rule that receives value and uses SQLBuilder
        dynamic_status: (value, sourceInstance: SQLBuilder) => {
          // Use the filter value to generate different SQL expressions
          const targetValue = value.eq
          return `CASE WHEN u.status = '${targetValue === 'Active' ? 'active' : 'inactive'}' THEN '${targetValue}' ELSE 'Unknown' END`
        }
      }

      // Execute source to get SQLBuilder instance
      const sourceInstance = driver.source(sourceFunction)
      
      // Create QueryCriteria with function-based rules
      const criteria = new QueryCriteria(
        rules,
        {
          filter: {
            id: { eq: 1 },
            dynamic_status: { eq: 'Active' }
          }
        },
        sourceInstance
      )

      await sourceInstance.execute(criteria)

      // Verify that the SQL was generated correctly with function-based rules
      expect(prismaMock.$queryRawUnsafe).toHaveBeenCalled()
      
      const [sql, ...params] = prismaMock.$queryRawUnsafe.mock.lastCall || []
      
      // Check that the function-based rule was executed and SQL contains the result
      expect(sql).toContain('SELECT')
      expect(sql).toContain('FROM')
      expect(sql).toContain('users')
      expect(params).toContain(1) // id filter
      expect(params).toContain('Active') // dynamic_status filter
    })

    it('should handle mixed static and function-based rules', async () => {
      const sourceFunction = (builder: SQLBuilder) => {
        return builder
          .from('products', 'p')
          .column('p.id')
          .column('p.name')
          .column('p.price')
      }

      const rules = {
        id: 'p.id', // static rule
        name: 'p.name', // static rule
        // Function-based rule that uses filter value
        price_category: (value, sourceInstance: SQLBuilder) => {
          // Generate different SQL based on the filter value
          const threshold = value.eq === 'premium' ? 1000 : 500
          return `CASE WHEN p.price >= ${threshold} THEN '${value.eq}' ELSE 'standard' END`
        }
      }

      const sourceInstance = driver.source(sourceFunction)
      
      const criteria = new QueryCriteria(
        rules,
        {
          filter: {
            name: { contains: 'laptop' },
            price_category: { eq: 'premium' }
          }
        },
        sourceInstance
      )

      await sourceInstance.execute(criteria)

      expect(prismaMock.$queryRawUnsafe).toHaveBeenCalled()
      
      const [sql, ...params] = prismaMock.$queryRawUnsafe.mock.lastCall || []
      
      expect(sql).toContain('products')
      expect(params).toContain('%laptop%') // static rule filter
      expect(params).toContain('premium') // function-based rule filter
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
