import { describe, it } from 'vitest'

import { QueryRunnerResourceNotFoundException } from './exceptions'
import {
  QueryRunnerCriteria,
} from './interfaces'

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

describe.todo('QueryRunner - Method: find(params: QueryRunnerCriteria<TestData>)', () => {
  describe.todo('When matching TestData exists', () => {
    it.todo('should return Promise<TestData> resolving to matching TestData')
    it.todo('should apply QueryRunnerInterface contract for single record retrieval')
    it.todo('should never return null (throws exception instead)')
  })

  describe.todo('When no matching record exists', () => {
    it.todo('should reject Promise with QueryRunnerResourceNotFoundException')
    it.todo('should include QuerySpecification.name in exception message')
    it.todo('should include search criteria in exception message')
  })

  describe.todo('When multiple matching TestData exist', () => {
    it.todo('should return Promise<TestData> resolving to first matching TestData')
    it.todo('should respect orderBy for determining "first" record')
  })

  describe.todo('With params: {filter: {status: {eq: "active"}}, orderBy: "name:desc", skip: 2}', () => {
    it.todo('should return Promise<TestData> applying all criteria')
    it.todo('should respect QueryFilter<TestData> filtering rules')
    it.todo('should respect sorting and pagination parameters')
    it.todo('should respect QuerySpecification.rules property mapping')
  })

  describe.todo('Error handling', () => {
    it.todo('should reject Promise when data retrieval fails')
    it.todo('should reject Promise with QueryRunnerResourceNotFoundException when no match')
    it.todo('should provide meaningful error information')
  })
})