import { QueryResultList, QueryRunnerCriteria } from '../'

import { beforeEach, describe, expect, it } from 'vitest'

import { runMiddleware } from '../test-utils/run-middleware'
import { inflate } from './inflate'

type Data = {
  prop1: string
  prop2: string
  prop3: string
}

describe('query-module / middlewares / inflate', () => {
  let criteria: QueryRunnerCriteria<Data>
  let result: QueryResultList<Data>

  beforeEach(() => {
    criteria = {}
    result = {
      items: [
        {
          prop1: 'default value',
          prop2: 'default value',
          prop3: 'default value',
        },
      ],
    }
  })

  describe('Specify a string in column', () => {
    describe('Iteratee returns a valid value', () => {
      it('should be overwrite columns value', async () => {
        await runMiddleware(
          criteria,
          result,
          inflate('prop1', () => 'new value'),
        )
        expect(result).toStrictEqual({
          items: [
            {
              prop1: 'new value',
              prop2: 'default value',
              prop3: 'default value',
            },
          ],
        })
      })
    })
  })

  describe('Specify an array in column', () => {
    describe('Iteratee returns a valid value', () => {
      it('should be overwrite specified columns value', async () => {
        await runMiddleware(
          criteria,
          result,
          inflate(['prop1', 'prop2'], () => 'new value'),
        )
        expect(result).toStrictEqual({
          items: [
            {
              prop1: 'new value',
              prop2: 'new value',
              prop3: 'default value',
            },
          ],
        })
      })
    })
  })
})
