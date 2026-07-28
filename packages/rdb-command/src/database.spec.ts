import { beforeEach, describe, expect, it, MockInstance, vi } from 'vitest'

import { DataBase } from './database'
import {
  DataBaseConnectorPort,
  DataBaseLogger,
  DataBasePort,
} from './interfaces'
import { cast } from './upsert/cast'
import { isRawExpression } from './upsert/is-raw-expression'
import { now } from './upsert/now'
import { null_value } from './upsert/null-value'
import { raw } from './upsert/raw'

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

    describe('sync', () => {
      let transaction_spy: MockInstance

      beforeEach(() => {
        transaction_spy = vi.spyOn(conn, 'transaction')
      })

      describe('with no key (full property comparison)', () => {
        it('should create new records when they do not exist', async () => {
          query_spy
            .mockResolvedValueOnce([]) // no existing records
            .mockResolvedValueOnce([
              { name: 'John', email: 'john@example.com' },
            ]) // find after first create
            .mockResolvedValueOnce([
              { name: 'Jane', email: 'jane@example.com' },
            ]) // find after second create

          const result = await db.sync('users', {}, [
            { name: 'John', email: 'john@example.com' },
            { name: 'Jane', email: 'jane@example.com' },
          ])

          expect(execute_spy).toHaveBeenCalledTimes(2) // 2 creates
          expect(result.created).toHaveLength(2)
          expect(result.unchanged).toHaveLength(0)
          expect(result.deleted).toHaveLength(0)
        })

        it('should keep unchanged records', async () => {
          const existingRecords = [
            { id: 1, name: 'John', email: 'john@example.com' },
            { id: 2, name: 'Jane', email: 'jane@example.com' },
          ]
          query_spy.mockResolvedValueOnce(existingRecords) // existing records query

          const result = await db.sync('users', {}, [
            { id: 1, name: 'John', email: 'john@example.com' },
            { id: 2, name: 'Jane', email: 'jane@example.com' },
          ])

          expect(execute_spy).not.toHaveBeenCalled() // no creates or deletes
          expect(result.created).toHaveLength(0)
          expect(result.unchanged).toHaveLength(2)
          expect(result.deleted).toHaveLength(0)
        })

        it('should delete unmatched records by default', async () => {
          const existingRecords = [
            { id: 1, name: 'John', email: 'john@example.com' },
            { id: 2, name: 'Jane', email: 'jane@example.com' },
            { id: 3, name: 'Bob', email: 'bob@example.com' },
          ]
          query_spy.mockResolvedValueOnce(existingRecords)

          const result = await db.sync('users', {}, [
            { id: 1, name: 'John', email: 'john@example.com' },
          ])

          expect(result.unchanged).toHaveLength(1)
          expect(result.deleted).toHaveLength(2)
        })

        it('should not delete when noDeleteUnmatched is true', async () => {
          const existingRecords = [
            { id: 1, name: 'John', email: 'john@example.com' },
            { id: 2, name: 'Jane', email: 'jane@example.com' },
          ]
          query_spy.mockResolvedValueOnce(existingRecords)

          const result = await db.sync(
            'users',
            {},
            [{ id: 1, name: 'John', email: 'john@example.com' }],
            { noDeleteUnmatched: true },
          )

          expect(result.unchanged).toHaveLength(1)
          expect(result.deleted).toHaveLength(0)
        })
      })

      describe('with key field comparison', () => {
        it('should match records by single key field', async () => {
          const existingRecords = [
            { id: 1, email: 'john@example.com', name: 'John Doe' },
          ]
          query_spy.mockResolvedValueOnce(existingRecords)

          const result = await db.sync(
            'users',
            {},
            [
              { email: 'john@example.com', name: 'John Smith' }, // different name, same email
            ],
            { key: 'email' },
          )

          expect(result.unchanged).toHaveLength(1)
          expect(result.created).toHaveLength(0)
          expect(result.deleted).toHaveLength(0)
        })

        it('should match records by multiple key fields', async () => {
          const existingRecords = [
            { id: 1, userId: 'user1', roleId: 'role1', created: '2023-01-01' },
          ]
          query_spy.mockResolvedValueOnce(existingRecords)

          const result = await db.sync(
            'user_roles',
            {},
            [
              { userId: 'user1', roleId: 'role1', created: '2023-12-01' }, // different created date
            ],
            { key: ['userId', 'roleId'] },
          )

          expect(result.unchanged).toHaveLength(1)
          expect(result.created).toHaveLength(0)
          expect(result.deleted).toHaveLength(0)
        })
      })

      describe('with PK generation', () => {
        it('should generate PK when not provided', async () => {
          query_spy
            .mockResolvedValueOnce([]) // no existing records
            .mockResolvedValueOnce([{ id: 'generated-id', name: 'John' }]) // find after create

          const pkGenerator = vi.fn().mockReturnValue('generated-id')

          const result = await db.sync(
            'users',
            {},
            [
              { name: 'John' }, // no id provided
            ],
            {
              pk: {
                column: 'id',
                generator: pkGenerator,
              },
            },
          )

          expect(pkGenerator).toHaveBeenCalled()
          expect(result.created).toHaveLength(1)
        })

        it('should not generate PK when already provided', async () => {
          query_spy
            .mockResolvedValueOnce([]) // no existing records
            .mockResolvedValueOnce([{ id: 'existing-id', name: 'John' }]) // find after create

          const pkGenerator = vi.fn().mockReturnValue('generated-id')

          await db.sync(
            'users',
            {},
            [
              { id: 'existing-id', name: 'John' }, // id provided
            ],
            {
              pk: {
                column: 'id',
                generator: pkGenerator,
              },
            },
          )

          expect(pkGenerator).not.toHaveBeenCalled()
        })
      })

      it('should execute within transaction', async () => {
        query_spy.mockResolvedValue([])

        await db.sync('users', {}, [])

        expect(transaction_spy).toHaveBeenCalledTimes(1)
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

      it('should rollback when callback throws error', async () => {
        const callbackError = new Error('Callback failed')
        let transactionCallbackCalled = false
        let transactionCallbackError: Error | null = null

        transaction_spy.mockImplementation(async (callback) => {
          transactionCallbackCalled = true
          try {
            await callback(conn)
          } catch (error) {
            transactionCallbackError = error as Error
            throw error // Re-throw to simulate rollback
          }
        })

        await expect(
          db.txn(async (txDb) => {
            await txDb.create('example', { id: 'test_id', value: 'test_value' })
            throw callbackError
          }),
        ).rejects.toThrow('Callback failed')

        expect(transactionCallbackCalled).toBe(true)
        expect(transactionCallbackError).toEqual(callbackError)
        expect(transaction_spy).toHaveBeenCalledTimes(1)
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

  describe('MySQL and PostgreSQL placeholder patterns', () => {
    let conn: DataBaseConnectorPort
    let execute_spy: MockInstance

    beforeEach(() => {
      conn = new TestConnector()
      execute_spy = vi.spyOn(conn, 'execute')
    })

    describe('MySQL placeholder pattern (?)', () => {
      let db: DataBasePort

      beforeEach(() => {
        db = new DataBase(conn, new DummyDataBaseLogger(), {
          placeholder: '?',
        })
      })

      it('should generate correct SQL and replacements for update', async () => {
        await db.update('users', { id: 1 }, { name: 'John', age: 30 })

        // MySQLの場合、プレースホルダーは全て ? で、
        // replacements は SET句の値が先、WHERE句の値が後
        expect(execute_spy).toHaveBeenCalledWith(
          'UPDATE `users` SET `name` = ?, `age` = ? WHERE (`id` = ?)',
          ['John', 30, 1],
        )
      })

      it('should handle multiple WHERE conditions correctly', async () => {
        await db.update(
          'posts',
          { userId: 1, status: 'active' },
          { title: 'Updated Title', content: 'New Content' },
        )

        expect(execute_spy).toHaveBeenCalledWith(
          'UPDATE `posts` SET `title` = ?, `content` = ? WHERE (`userId` = ?)\n  AND (`status` = ?)',
          ['Updated Title', 'New Content', 1, 'active'],
        )
      })

      it('should generate correct SQL and replacements for create', async () => {
        await db.create('users', {
          id: 1,
          name: 'John',
          email: 'john@example.com',
        })

        expect(execute_spy).toHaveBeenCalledWith(
          'INSERT INTO `users` (`id`,`name`,`email`) VALUES (?,?,?)',
          [1, 'John', 'john@example.com'],
        )
      })

      it('should generate correct SQL and replacements for delete', async () => {
        await db.delete('users', { id: 1 })

        expect(execute_spy).toHaveBeenCalledWith(
          'DELETE FROM `users` WHERE (`id` = ?)',
          [1],
        )
      })
    })

    describe('PostgreSQL placeholder pattern ($)', () => {
      let db: DataBasePort

      beforeEach(() => {
        db = new DataBase(conn, new DummyDataBaseLogger(), {
          placeholder: '$',
        })
      })

      it('should generate correct SQL and replacements for update', async () => {
        await db.update('users', { id: 1 }, { name: 'John', age: 30 })

        // PostgreSQLの場合、番号付きプレースホルダー ($1, $2, ...)
        // replacements は WHERE句の値が先、SET句の値が後（従来の動作を維持）
        expect(execute_spy).toHaveBeenCalledWith(
          'UPDATE `users` SET `name` = $2, `age` = $3 WHERE (`id` = $1)',
          [1, 'John', 30],
        )
      })

      it('should handle multiple WHERE conditions correctly', async () => {
        await db.update(
          'posts',
          { userId: 1, status: 'active' },
          { title: 'Updated Title', content: 'New Content' },
        )

        expect(execute_spy).toHaveBeenCalledWith(
          'UPDATE `posts` SET `title` = $3, `content` = $4 WHERE (`userId` = $1)\n  AND (`status` = $2)',
          [1, 'active', 'Updated Title', 'New Content'],
        )
      })

      it('should generate correct SQL and replacements for create', async () => {
        await db.create('users', {
          id: 1,
          name: 'John',
          email: 'john@example.com',
        })

        expect(execute_spy).toHaveBeenCalledWith(
          'INSERT INTO `users` (`id`,`name`,`email`) VALUES ($1,$2,$3)',
          [1, 'John', 'john@example.com'],
        )
      })

      it('should generate correct SQL and replacements for delete', async () => {
        await db.delete('users', { id: 1 })

        expect(execute_spy).toHaveBeenCalledWith(
          'DELETE FROM `users` WHERE (`id` = $1)',
          [1],
        )
      })
    })
  })

  describe('upsert', () => {
    let conn: DataBaseConnectorPort
    let db: DataBasePort
    let execute_spy: MockInstance
    let query_spy: MockInstance

    beforeEach(() => {
      conn = new TestConnector()
      db = new DataBase(conn, new DummyDataBaseLogger(), {
        placeholder: '$',
        quote: '"',
      })
      execute_spy = vi.spyOn(conn, 'execute')
      query_spy = vi.spyOn(conn, 'query')
    })

    describe('全カラムが通常値で、ON CONFLICT DO NOTHING・returning未指定の場合', () => {
      it('execute で INSERT ... ON CONFLICT DO NOTHING を発行し、rows は空配列を返す', async () => {
        const result = await db.upsert(
          'users',
          { id: 'u1', email: 'e', display_name: 'd' },
          { target: ['id'], action: { type: 'nothing' } },
        )

        expect(execute_spy).toHaveBeenCalledWith(
          'INSERT INTO "users" ("id","email","display_name") VALUES ($1,$2,$3) ON CONFLICT ("id") DO NOTHING',
          ['u1', 'e', 'd'],
        )
        expect(query_spy).not.toHaveBeenCalled()
        expect(result).toEqual({ rows: [] })
      })
    })

    describe('cast() を含む値・複合 conflict target・returning 指定の場合', () => {
      beforeEach(async () => {
        query_spy.mockResolvedValue([{ id: 'trip1' }])
        await db.upsert(
          'trips',
          {
            user_id: 'u1',
            client_trip_id: cast('c1', 'uuid'),
            started_at: 's',
            ended_at: 'e',
            title: 't',
            note: 'n',
          },
          {
            target: ['user_id', 'client_trip_id'],
            action: { type: 'nothing' },
          },
          { returning: ['id'] },
        )
      })

      it('query で発行し、cast のキャスト表記を保持したまま以降の採番が連番になる', () => {
        expect(query_spy).toHaveBeenCalledWith(
          'INSERT INTO "trips" ("user_id","client_trip_id","started_at","ended_at","title","note") VALUES ($1,$2::uuid,$3,$4,$5,$6) ON CONFLICT ("user_id","client_trip_id") DO NOTHING RETURNING "id"',
          ['u1', 'c1', 's', 'e', 't', 'n'],
        )
        expect(execute_spy).not.toHaveBeenCalled()
      })
    })

    describe('now() のようにバインドを持たない raw 式が末尾にあり、DO UPDATE SET が excluded 展開の場合', () => {
      it('now() の直前までの採番が正しく閉じ、excluded 展開の SQL になる', async () => {
        await db.upsert(
          'monthly_stats',
          {
            user_id: 'u1',
            year_month: cast('2024-01', 'date'),
            trip_count: 3,
            total_distance: 100,
            meta: cast('{}', 'jsonb'),
            updated_at: now(),
          },
          {
            target: ['user_id', 'year_month'],
            action: { type: 'update', set: ['trip_count', 'total_distance'] },
          },
        )

        expect(execute_spy).toHaveBeenCalledWith(
          'INSERT INTO "monthly_stats" ("user_id","year_month","trip_count","total_distance","meta","updated_at") VALUES ($1,$2::date,$3,$4,$5::jsonb,now()) ON CONFLICT ("user_id","year_month") DO UPDATE SET "trip_count" = excluded."trip_count", "total_distance" = excluded."total_distance"',
          ['u1', '2024-01', 3, 100, '{}'],
        )
      })
    })

    describe('raw() の式内に複数バインド（?, ?）を含み、null_value() / now() が混在する場合', () => {
      it('式内バインドが連番で採番され、null_value / now はバインドを消費しない', async () => {
        query_spy.mockResolvedValue([{ id: 'place1' }])

        await db.upsert(
          'places',
          {
            user_id: 'u1',
            name: 'home',
            location: raw('ST_SetSRID(ST_MakePoint(?, ?), 4326)', 139.0, 35.0),
            address: 'addr',
            name_source: null_value(),
            visit_count: 1,
            created_at: now(),
            updated_at: now(),
          },
          {
            target: ['user_id'],
            targetWhere: raw("name_source = 'home'"),
            action: { type: 'nothing' },
          },
          { returning: ['id'] },
        )

        expect(query_spy).toHaveBeenCalledWith(
          'INSERT INTO "places" ("user_id","name","location","address","name_source","visit_count","created_at","updated_at") VALUES ($1,$2,ST_SetSRID(ST_MakePoint($3, $4), 4326),$5,NULL,$6,now(),now()) ON CONFLICT ("user_id") WHERE name_source = \'home\' DO NOTHING RETURNING "id"',
          ['u1', 'home', 139, 35, 'addr', 1],
        )
      })
    })

    describe('DO UPDATE の set に明示値（RawExpression によるインクリメント等）を渡す場合', () => {
      it('明示値が採番されて replacements に積まれ、DO UPDATE SET に反映される', async () => {
        await db.upsert(
          'places',
          { id: 'p1', visit_count: 1 },
          {
            target: ['id'],
            action: {
              type: 'update',
              set: { visit_count: raw('places.visit_count + ?', 1) },
            },
          },
        )

        expect(execute_spy).toHaveBeenCalledWith(
          'INSERT INTO "places" ("id","visit_count") VALUES ($1,$2) ON CONFLICT ("id") DO UPDATE SET "visit_count" = places.visit_count + $3',
          ['p1', 1, 1],
        )
      })
    })

    describe('returning に "*" を指定する場合', () => {
      it('RETURNING * を発行する', async () => {
        query_spy.mockResolvedValue([{ id: 'u1', email: 'e' }])

        await db.upsert(
          'users',
          { id: 'u1', email: 'e' },
          { target: ['id'], action: { type: 'nothing' } },
          { returning: '*' },
        )

        expect(query_spy).toHaveBeenCalledWith(
          'INSERT INTO "users" ("id","email") VALUES ($1,$2) ON CONFLICT ("id") DO NOTHING RETURNING *',
          ['u1', 'e'],
        )
      })
    })

    describe('returning の有無による execute / query の使い分けの場合', () => {
      describe('returning 未指定の場合', () => {
        it('execute を呼び、rows は空配列を返す', async () => {
          const result = await db.upsert(
            'users',
            { id: 'u1' },
            { target: ['id'], action: { type: 'nothing' } },
          )

          expect(execute_spy).toHaveBeenCalledTimes(1)
          expect(query_spy).not.toHaveBeenCalled()
          expect(result).toEqual({ rows: [] })
        })
      })

      describe('returning 指定の場合', () => {
        it('query を呼び、rows に結果が入る', async () => {
          query_spy.mockResolvedValue([{ id: 'u1' }])

          const result = await db.upsert(
            'users',
            { id: 'u1' },
            { target: ['id'], action: { type: 'nothing' } },
            { returning: ['id'] },
          )

          expect(query_spy).toHaveBeenCalledTimes(1)
          expect(execute_spy).not.toHaveBeenCalled()
          expect(result).toEqual({ rows: [{ id: 'u1' }] })
        })
      })
    })

    describe('raw 式内の ? の個数と bindings の長さが一致しない場合', () => {
      it('placeholder count と bindings length を含む Error を throw する', async () => {
        await expect(
          db.upsert(
            'x',
            { a: raw('foo(?, ?)', 1) },
            { target: ['a'], action: { type: 'nothing' } },
          ),
        ).rejects.toThrow(
          'raw expression placeholder count (2) does not match bindings length (1): foo(?, ?)',
        )
      })
    })

    describe('MySQL（placeholder: "?"）で呼び出す場合', () => {
      let mysqlConn: DataBaseConnectorPort
      let mysqlDb: DataBasePort

      beforeEach(() => {
        mysqlConn = new TestConnector()
        mysqlDb = new DataBase(mysqlConn, new DummyDataBaseLogger(), {
          placeholder: '?',
        })
      })

      it('サポート対象外である旨の Error を throw する', async () => {
        await expect(
          mysqlDb.upsert(
            'users',
            { id: 'u1' },
            { target: ['id'], action: { type: 'nothing' } },
          ),
        ).rejects.toThrow(
          'upsert supports PostgreSQL ($n placeholder) only; MySQL is not supported',
        )
      })
    })

    describe('data が空オブジェクトの場合', () => {
      it('column が必要である旨の Error を throw する', async () => {
        await expect(
          db.upsert(
            'users',
            {},
            { target: ['id'], action: { type: 'nothing' } },
          ),
        ).rejects.toThrow('upsert requires at least one column in data')
      })
    })

    describe('conflict.target が空配列の場合', () => {
      it('conflict target column が必要である旨の Error を throw する', async () => {
        await expect(
          db.upsert(
            'users',
            { id: 'u1' },
            { target: [], action: { type: 'nothing' } },
          ),
        ).rejects.toThrow('upsert requires at least one conflict target column')
      })
    })

    describe('DO UPDATE の set が空の場合', () => {
      it('set が配列で空の場合、set column が必要である旨の Error を throw する', async () => {
        await expect(
          db.upsert(
            'users',
            { id: 'u1' },
            {
              target: ['id'],
              action: { type: 'update', set: [] },
            },
          ),
        ).rejects.toThrow(
          'upsert DO UPDATE requires at least one column in set',
        )
      })

      it('set がオブジェクトで空の場合、set column が必要である旨の Error を throw する', async () => {
        await expect(
          db.upsert(
            'users',
            { id: 'u1' },
            {
              target: ['id'],
              action: { type: 'update', set: {} },
            },
          ),
        ).rejects.toThrow(
          'upsert DO UPDATE requires at least one column in set',
        )
      })
    })

    describe('returning が空配列の場合', () => {
      it('列を含まない RETURNING を生成せず、column が必要である旨の Error を throw する', async () => {
        await expect(
          db.upsert(
            'users',
            { id: 'u1' },
            {
              target: ['id'],
              action: { type: 'nothing' },
            },
            { returning: [] },
          ),
        ).rejects.toThrow('upsert RETURNING requires at least one column')
      })
    })
  })

  describe('upsert のヘルパー関数', () => {
    describe('raw', () => {
      it('sql と bindings を保持した RawExpression を返す', () => {
        expect(raw('?::date', 'x')).toEqual({
          __raw: true,
          sql: '?::date',
          bindings: ['x'],
        })
      })
    })

    describe('now', () => {
      it('now() を表す RawExpression を返す', () => {
        expect(now()).toEqual({ __raw: true, sql: 'now()', bindings: [] })
      })
    })

    describe('null_value', () => {
      it('NULL を表す RawExpression を返す', () => {
        expect(null_value()).toEqual({
          __raw: true,
          sql: 'NULL',
          bindings: [],
        })
      })
    })

    describe('cast', () => {
      it('?::type 形式の RawExpression を返す', () => {
        expect(cast('v', 'jsonb')).toEqual({
          __raw: true,
          sql: '?::jsonb',
          bindings: ['v'],
        })
      })
    })

    describe('isRawExpression', () => {
      it('raw() で作った値を RawExpression と判定する', () => {
        expect(isRawExpression(raw('now()'))).toBe(true)
      })

      it('通常の値を RawExpression でないと判定する', () => {
        expect(isRawExpression('plain')).toBe(false)
        expect(isRawExpression(1)).toBe(false)
        expect(isRawExpression(null)).toBe(false)
        expect(isRawExpression({ sql: 'x' })).toBe(false)
      })
    })
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
