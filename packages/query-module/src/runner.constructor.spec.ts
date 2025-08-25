import { describe, it, expect, beforeEach } from 'vitest'

import { defineQuery } from './functions/define-query'
import { QueryRunnerInterface } from './interfaces'
import { QueryRunner } from './runner'
import { createDriver, TestDriver } from './test-utils/test-driver'
import { createLogger } from './test-utils/test-mock-logger'

type TestData = {
  id: number
  name: string
  status: 'active' | 'inactive'
  email: string | null
  metadata?: {
    tags: string[]
    priority: number
  }
}

describe('QueryRunner - Constructor', () => {
  let driver: TestDriver

  beforeEach(() => {
    driver = createDriver()
  })

  describe('When valid parameters are provided', () => {
    it('should create QueryRunnerInterface<TestData> instance successfully', () => {
      const runner = defineQuery<TestData>(driver, {
        name: 'test-query',
        source: () => [],
        rules: {},
      })

      expect(runner).toBeInstanceOf(QueryRunner)
      expect(runner).toBeDefined()
    })

    it('should be ready to execute one(), many(), find() methods', () => {
      const runner = defineQuery<TestData>(driver, {
        name: 'test-query',
        source: () => [],
        rules: {},
      })

      expect(typeof runner.one).toBe('function')
      expect(typeof runner.many).toBe('function')
      expect(typeof runner.find).toBe('function')
    })

    it('should implement QueryRunnerInterface contract correctly', () => {
      const runner = defineQuery<TestData>(driver, {
        name: 'test-query',
        source: () => [],
        rules: {},
      })

      // Type check - should satisfy QueryRunnerInterface
      const interface_check: QueryRunnerInterface<TestData> = runner
      expect(interface_check).toBeDefined()
    })
  })

  describe('When null/undefined parameters are provided', () => {
    it('should throw TypeError when constructed with null parameters', () => {
      expect(
        () => new QueryRunner(null as any, null as any, null as any),
      ).toThrow(TypeError)
    })

    it('should throw TypeError when constructed with undefined parameters', () => {
      expect(
        () =>
          new QueryRunner(undefined as any, undefined as any, undefined as any),
      ).toThrow(TypeError)
    })
  })
})
