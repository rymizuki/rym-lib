import { beforeEach, describe, expect, it, MockInstance, vi } from 'vitest'

import { DataBase } from './database'
import {
  DataBaseConnectorPort,
  DataBaseLogger,
  DataBasePort,
} from './interfaces'

class DummyDataBaseLogger implements DataBaseLogger {
  debug(format: string, ...args: unknown[]): void {}
  info(format: string, ...args: unknown[]): void {}
  warning(format: string, ...args: unknown[]): void {}
  error(format: string, ...args: unknown[]): void {}
  critical(format: string, ...args: unknown[]): void {}
}

describe('db', () => {
  describe('no options', () => {
    let conn: DataBaseConnectorPort
    let db: DataBasePort
    beforeEach(() => {
      conn = new TestConnector()
      db = new DataBase(conn, new DummyDataBaseLogger())
    })

    let execute_spy: MockInstance
    let query_spy: MockInstance
    beforeEach(() => {
      execute_spy = vi.spyOn(conn, 'execute')
      query_spy = vi.spyOn(conn, 'query')
    })

    describe('create', () => {
      beforeEach(async () => {
        await db.create('example', {
          id: 'example_id',
          value: 'example_value',
        })
      })
      it('should be execute INSERT', () => {
        expect(execute_spy).toHaveBeenCalledWith(
          'INSERT INTO `example` (`id`,`value`) VALUES ($1,$2)',
          ['example_id', 'example_value'],
        )
      })
    })
    describe('update', () => {
      beforeEach(async () => {
        await db.update(
          'example',
          {
            id: 'example_id',
          },
          {
            foreign_id: 'example_foreign_id',
            value: 'example_value',
          },
        )
      })
      it('should be execute UPDATE', () => {
        expect(execute_spy).toHaveBeenCalledWith(
          'UPDATE `example` SET `foreign_id` = $2, `value` = $3 WHERE (`id` = $1)',
          ['example_id', 'example_foreign_id', 'example_value'],
        )
      })
    })
    describe('delete', () => {
      beforeEach(async () => {
        await db.delete('example', {
          id: 'example_id',
        })
      })
      it('should be execute DELETE', () => {
        expect(execute_spy).toHaveBeenCalledWith(
          'DELETE FROM `example` WHERE (`id` = $1)',
          ['example_id'],
        )
      })
    })
    describe('find', () => {
      beforeEach(async () => {
        await db.find('example', {
          id: 'example_id',
        })
      })
      it('should be query SELECT', () => {
        expect(query_spy).toHaveBeenCalledWith(
          'SELECT\n  *\nFROM\n  `example`\nWHERE\n  ((`id` = $1))\nLIMIT 1',
          ['example_id'],
        )
      })
    })
    describe('findOrCreate', () => {
      describe('when record exists', () => {
        beforeEach(() => {
          query_spy.mockResolvedValue([
            { id: 'existing_id', value: 'existing_value' },
          ])
        })

        it('should return existing record without creating new one', async () => {
          const result = await db.findOrCreate(
            'example',
            { id: 'existing_id' },
            { id: 'existing_id', value: 'new_value' },
          )

          expect(result).toEqual({ id: 'existing_id', value: 'existing_value' })
          expect(execute_spy).not.toHaveBeenCalled()
          expect(query_spy).toHaveBeenCalledTimes(1)
        })
      })

      describe('when record does not exist', () => {
        beforeEach(() => {
          query_spy
            .mockResolvedValueOnce([]) // first call returns empty (not found)
            .mockResolvedValueOnce([{ id: 'new_id', value: 'new_value' }]) // second call returns created record
        })

        it('should create and return new record', async () => {
          const result = await db.findOrCreate(
            'example',
            { id: 'new_id' },
            { id: 'new_id', value: 'new_value' },
          )

          expect(result).toEqual({ id: 'new_id', value: 'new_value' })
          expect(execute_spy).toHaveBeenCalledWith(
            'INSERT INTO `example` (`id`,`value`) VALUES ($1,$2)',
            ['new_id', 'new_value'],
          )
          expect(query_spy).toHaveBeenCalledTimes(2)
        })
      })

      describe('when creation fails', () => {
        beforeEach(() => {
          query_spy
            .mockResolvedValueOnce([]) // first call returns empty (not found)
            .mockResolvedValueOnce([]) // second call also returns empty (creation failed)
        })

        it('should throw error when record creation fails', async () => {
          await expect(
            db.findOrCreate(
              'example',
              { id: 'failed_id' },
              { id: 'failed_id', value: 'failed_value' },
            ),
          ).rejects.toThrow(
            'record creation failed. table: example, cond: {"id":"failed_id"}',
          )
        })
      })
    })
    describe('updateOrCreate', () => {
      describe('when record exists', () => {
        beforeEach(() => {
          query_spy.mockResolvedValue([
            { id: 'existing_id', value: 'existing_value' },
          ])
        })

        it('should update existing record', async () => {
          await db.updateOrCreate(
            'example',
            { id: 'existing_id' },
            { value: 'updated_value' },
            { id: 'existing_id', value: 'created_value' },
          )

          expect(execute_spy).toHaveBeenCalledWith(
            'UPDATE `example` SET `value` = $2 WHERE (`id` = $1)',
            ['existing_id', 'updated_value'],
          )
          expect(query_spy).toHaveBeenCalledTimes(1)
        })
      })

      describe('when record does not exist', () => {
        beforeEach(() => {
          query_spy.mockResolvedValue([])
        })

        it('should create new record', async () => {
          await db.updateOrCreate(
            'example',
            { id: 'new_id' },
            { value: 'updated_value' },
            { id: 'new_id', value: 'created_value' },
          )

          expect(execute_spy).toHaveBeenCalledWith(
            'INSERT INTO `example` (`id`,`value`) VALUES ($1,$2)',
            ['new_id', 'created_value'],
          )
          expect(query_spy).toHaveBeenCalledTimes(1)
        })
      })
    })

    describe('txn', () => {
      let transaction_spy: MockInstance

      beforeEach(() => {
        transaction_spy = vi.spyOn(conn, 'transaction')
      })

      it('should execute callback within transaction', async () => {
        const result = await db.txn(async (txDb) => {
          await txDb.create('example', { id: 'tx_id', value: 'tx_value' })
          return 'transaction_result'
        })

        expect(result).toBe('transaction_result')
        expect(transaction_spy).toHaveBeenCalledTimes(1)
      })

      it('should provide new database instance with same middlewares', async () => {
        const middleware = {
          preprocess: vi.fn().mockImplementation((payload) => payload),
        }
        db.use(middleware)

        await db.txn(async (txDb) => {
          await txDb.create('example', { id: 'tx_id', value: 'tx_value' })
        })

        expect(middleware.preprocess).toHaveBeenCalled()
      })

      it('should handle transaction errors', async () => {
        const error = new Error('Transaction failed')
        transaction_spy.mockRejectedValue(error)

        await expect(
          db.txn(async () => {
            throw error
          }),
        ).rejects.toThrow('Transaction failed')
      })
    })

    describe('use (middleware)', () => {
      let middleware_spy: MockInstance

      beforeEach(() => {
        middleware_spy = vi.fn().mockImplementation((payload) => payload)
      })

      it('should add middleware and call preprocess', async () => {
        const middleware = {
          preprocess: middleware_spy,
        }

        db.use(middleware)
        await db.create('example', { id: 'test_id', value: 'test_value' })

        expect(middleware_spy).toHaveBeenCalledWith(
          {
            sql: 'INSERT INTO `example` (`id`,`value`) VALUES ($1,$2)',
            replacements: ['test_id', 'test_value'],
          },
          {},
          expect.objectContaining({
            logger: expect.any(Object),
          }),
        )
      })

      it('should chain multiple middlewares', async () => {
        const middleware1 = {
          preprocess: vi.fn().mockImplementation((payload) => ({
            ...payload,
            sql: payload.sql + ' /* middleware1 */',
          })),
        }
        const middleware2 = {
          preprocess: vi.fn().mockImplementation((payload) => ({
            ...payload,
            sql: payload.sql + ' /* middleware2 */',
          })),
        }

        db.use(middleware1).use(middleware2)
        await db.create('example', { id: 'test_id', value: 'test_value' })

        expect(middleware1.preprocess).toHaveBeenCalled()
        expect(middleware2.preprocess).toHaveBeenCalled()
        expect(execute_spy).toHaveBeenCalledWith(
          'INSERT INTO `example` (`id`,`value`) VALUES ($1,$2) /* middleware1 */ /* middleware2 */',
          ['test_id', 'test_value'],
        )
      })

      it('should handle async middleware', async () => {
        const asyncMiddleware = {
          preprocess: vi.fn().mockImplementation(async (payload) => {
            await new Promise((resolve) => setTimeout(resolve, 1))
            return payload
          }),
        }

        db.use(asyncMiddleware)
        await db.create('example', { id: 'test_id', value: 'test_value' })

        expect(asyncMiddleware.preprocess).toHaveBeenCalled()
      })
    })
  })

  describe('options.quote = null', () => {
    let conn: DataBaseConnectorPort
    let db: DataBasePort
    beforeEach(() => {
      conn = new TestConnector()
      db = new DataBase(conn, new DummyDataBaseLogger(), { quote: null })
    })

    let execute_spy: MockInstance
    let query_spy: MockInstance
    beforeEach(() => {
      execute_spy = vi.spyOn(conn, 'execute')
      query_spy = vi.spyOn(conn, 'query')
    })

    describe('create', () => {
      beforeEach(async () => {
        await db.create('example', {
          id: 'example_id',
          value: 'example_value',
        })
      })
      it('should be execute INSERT', () => {
        expect(execute_spy).toHaveBeenCalledWith(
          'INSERT INTO example (id,value) VALUES ($1,$2)',
          ['example_id', 'example_value'],
        )
      })
    })
    describe('update', () => {
      beforeEach(async () => {
        await db.update(
          'example',
          {
            id: 'example_id',
          },
          {
            foreign_id: 'example_foreign_id',
            value: 'example_value',
          },
        )
      })
      it('should be execute UPDATE', () => {
        expect(execute_spy).toHaveBeenCalledWith(
          'UPDATE example SET foreign_id = $2, value = $3 WHERE (id = $1)',
          ['example_id', 'example_foreign_id', 'example_value'],
        )
      })
    })
    describe('delete', () => {
      beforeEach(async () => {
        await db.delete('example', {
          id: 'example_id',
        })
      })
      it('should be execute DELETE', () => {
        expect(execute_spy).toHaveBeenCalledWith(
          'DELETE FROM example WHERE (id = $1)',
          ['example_id'],
        )
      })
    })
    describe('find', () => {
      beforeEach(async () => {
        await db.find('example', {
          id: 'example_id',
        })
      })
      it('should be query SELECT', () => {
        expect(query_spy).toHaveBeenCalledWith(
          'SELECT\n  *\nFROM\n  example\nWHERE\n  ((id = $1))\nLIMIT 1',
          ['example_id'],
        )
      })
    })
    describe.skip('findOrCreate', () => {})
    describe.skip('updateOrCreate', () => {})
  })
})

class TestConnector implements DataBaseConnectorPort {
  public transactionCalls: Array<
    (conn: DataBaseConnectorPort) => Promise<void>
  > = []

  async execute(): Promise<void> {}
  async query<T>(): Promise<T[]> {
    return []
  }
  async transaction(
    exec: (conn: DataBaseConnectorPort) => Promise<void>,
  ): Promise<void> {
    this.transactionCalls.push(exec)
    await exec(this)
  }
}
