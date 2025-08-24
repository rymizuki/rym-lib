import { describe, expect, it, beforeEach } from 'vitest'

import { QueryDriverInterface } from '../interfaces'
import { QueryRunner } from '../runner'
import { createDriver, TestDriver } from '../test-utils/test-driver'
import { createLogger, TestMockLogger } from '../test-utils/test-mock-logger'
import { defineQuery } from './define-query'

describe('query-module / defineQuery', () => {
  let driver: TestDriver
  beforeEach(() => {
    driver = createDriver()
  })

  describe('basic', () => {
    it('should be return QueryRunner instance', () => {
      expect(
        defineQuery(driver, {
          name: 'test',
          source: () => [],
          rules: {},
        }),
      ).toBeInstanceOf(QueryRunner)
    })
  })

  describe('use custom logger', () => {
    it('should be enable custom logger', async () => {
      console.log(driver)
      const logger = createLogger()
      const runner = defineQuery(
        driver,
        {
          name: 'test',
          source: () => [],
          rules: {},
          middlewares: [
            {
              preprocess(criteria, context) {
                expect(context.logger).toBeInstanceOf(TestMockLogger)
              },
            },
          ],
        },
        {
          logger,
        },
      )
      await runner.many()
    })
  })

  describe('use custom builder', () => {
    it('should be return customized QueryRunner', () => {
      const CustomizedQueryRunner = class<
        Data,
        Driver extends QueryDriverInterface,
      > extends QueryRunner<Data, Driver> {
        custom = true
      }
      const runner = defineQuery(
        driver,
        {
          name: 'test',
          source: () => [],
          rules: {},
        },
        {},
        {
          builder: (driver, spec, ctx) => {
            return new CustomizedQueryRunner(driver, spec, ctx)
          },
        },
      )
      expect(runner).toBeInstanceOf(CustomizedQueryRunner)
    })
  })
})
