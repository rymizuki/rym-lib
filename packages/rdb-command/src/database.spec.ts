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
          'INSERT INTO `example` (`id`,`value`) VALUES (?,?)',
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
          'UPDATE `example` SET `foreign_id` = ?, `value` = ? WHERE (`id` = ?)',
          ['example_foreign_id', 'example_value', 'example_id'],
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
          'DELETE FROM `example` WHERE (`id` = ?)',
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
          'SELECT\n  *\nFROM\n  `example`\nWHERE\n  ((`id` = ?))\nLIMIT 1',
          ['example_id'],
        )
      })
    })
    describe.skip('findOrCreate', () => {})
    describe.skip('updateOrCreate', () => {})
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
          'INSERT INTO example (id,value) VALUES (?,?)',
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
          'UPDATE example SET foreign_id = ?, value = ? WHERE (id = ?)',
          ['example_foreign_id', 'example_value', 'example_id'],
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
          'DELETE FROM example WHERE (id = ?)',
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
          'SELECT\n  *\nFROM\n  example\nWHERE\n  ((id = ?))\nLIMIT 1',
          ['example_id'],
        )
      })
    })
    describe.skip('findOrCreate', () => {})
    describe.skip('updateOrCreate', () => {})
  })
})

class TestConnector implements DataBaseConnectorPort {
  async execute(): Promise<void> {}
  async query<T>(): Promise<T[]> {
    return []
  }
  async transaction(): Promise<void> {}
}
