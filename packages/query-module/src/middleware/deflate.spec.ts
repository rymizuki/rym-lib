import { QueryResultList, QueryRunnerCriteria } from '../'

import { beforeEach, describe, expect, it } from 'vitest'

import { runMiddleware } from '../test-utils/run-middleware'
import { deflate } from './deflate'

type Data = {
  prop1: string
  prop2: string
}

describe('query-module / middleware / inflate', () => {
  let criteria: QueryRunnerCriteria<Data>
  let result: QueryResultList<Data>

  beforeEach(() => {
    criteria = {
      filter: {
        prop1: { eq: 'default value' },
        prop2: { contains: 'default value' },
      },
    }
    result = { items: [] }
  })

  describe('Specify a string in column', () => {
    describe('Iteratee returns a valid value', () => {
      it('should be overwrite columns value', async () => {
        await runMiddleware(
          criteria,
          result,
          deflate('prop1', () => 'new value'),
        )
        expect(criteria).toStrictEqual({
          filter: {
            prop1: { eq: 'new value' },
            prop2: { contains: 'default value' },
          },
        })
      })
    })
  })

  describe('Specify am array in column', () => {
    describe('Iteratee returns a valid value', () => {
      it('should be overwrite columns value', async () => {
        await runMiddleware(
          criteria,
          result,
          deflate(['prop1', 'prop2'], () => 'new value'),
        )
        expect(criteria).toStrictEqual({
          filter: {
            prop1: { eq: 'new value' },
            prop2: { contains: 'new value' },
          },
        })
      })
    })
  })
})
