import { describe, it } from 'vitest'

import {
  QueryResultList,
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

describe.todo('QueryRunner - Rules Mapping with many()', () => {
  describe.todo('Filter with spec.rules property mapping', () => {
    it.todo('should map filter keys using spec.rules: {name: "user_name", id: "user_id"}')
    it.todo('should handle spec.rules with dot notation: {"metadata.priority": "priority_score"}')
    it.todo('should preserve unmapped keys when not in spec.rules')
  })

  describe.todo('Sorting with spec.rules property mapping', () => {
    it.todo('should map orderBy fields using spec.rules: {name: "user_name"}')
    it.todo('should handle orderBy: "metadata.priority:desc" with dot notation mapping')
  })

  describe.todo('Property mapping rules', () => {
    describe.todo('Basic mapping', () => {
      it.todo('should map simple property names')
      it.todo('should handle unmapped properties')
      it.todo('should preserve original property names when no mapping exists')
    })

    describe.todo('Dot notation mapping', () => {
      it.todo('should handle dot notation in source keys')
      it.todo('should handle dot notation in target keys')
      it.todo('should handle nested object mapping')
    })

    describe.todo('Complex mapping scenarios', () => {
      it.todo('should handle partial mapping')
      it.todo('should handle conflicting mappings')
      it.todo('should handle case-sensitive mappings')
    })
  })

  describe.todo('Criteria transformation', () => {
    describe.todo('When QuerySpecification.criteria function is provided', () => {
      it.todo('should apply criteria transformation to parameters')
      it.todo('should return Promise<QueryResultList<TestData>> with transformed criteria')
      it.todo('should handle criteria transformation errors appropriately')
    })

    describe.todo('When no criteria function is provided', () => {
      it.todo('should use parameters directly without transformation')
      it.todo('should not modify original params object')
    })
  })
})