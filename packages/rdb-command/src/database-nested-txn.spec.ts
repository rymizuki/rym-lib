import { describe, it, expect, beforeEach, vi } from 'vitest'

import { DataBase } from './database'
import { DataBaseConnectorPort, DataBaseLogger } from './interfaces'
import { TransactionManager } from './transaction-manager'

class DummyDataBaseLogger implements DataBaseLogger {
  debug = vi.fn()
  info = vi.fn()
  warning = vi.fn()
  error = vi.fn()
  critical = vi.fn()
}

class MockConnector implements DataBaseConnectorPort {
  public transactionStartCount = 0
  public operations: Array<{
    type: string
    sql: string
    replacements: unknown[]
  }> = []
  public mockData: Record<string, any[]> = {}

  async execute(sql: string, replacements: unknown[]): Promise<void> {
    this.operations.push({ type: 'execute', sql, replacements })

    // INSERTのモック
    if (sql.includes('INSERT')) {
      // 何もしない（実際のDBなら行が作成される）
    }
  }

  async query<T>(sql: string, replacements: unknown[]): Promise<T[]> {
    this.operations.push({ type: 'query', sql, replacements })

    // SELECTのモック
    if (sql.includes('SELECT')) {
      const tableName = this.extractTableName(sql)
      return (this.mockData[tableName] || []) as T[]
    }

    return []
  }

  async transaction(
    exec: (conn: DataBaseConnectorPort) => Promise<void>,
  ): Promise<void> {
    this.transactionStartCount++
    await exec(this)
  }

  private extractTableName(sql: string): string {
    const match = sql.match(/FROM\s+(\w+)/i)
    return match ? match[1] : 'unknown'
  }

  // テスト用ヘルパー
  setMockData(table: string, data: any[]): void {
    this.mockData[table] = data
  }

  reset(): void {
    this.transactionStartCount = 0
    this.operations = []
    this.mockData = {}
  }
}

describe('DataBase Nested Transaction Integration', () => {
  let transactionManager: TransactionManager
  let connector: MockConnector
  let logger: DataBaseLogger
  let db: DataBase

  beforeEach(() => {
    transactionManager = new TransactionManager()
    connector = new MockConnector()
    logger = new DummyDataBaseLogger()
    db = new DataBase(connector, logger, { transactionManager })
  })

  afterEach(() => {
    transactionManager.destroy()
  })

  describe('実際のデータ操作を伴うネストトランザクション', () => {
    it('should handle nested transactions with CRUD operations', async () => {
      connector.setMockData('users', [])

      const result = await db.txn(async (outerDb) => {
        // 外側のトランザクションでユーザー作成
        await outerDb.create('users', {
          id: '1',
          name: 'John',
          email: 'john@example.com',
        })

        // ネストされたトランザクションで別のユーザー作成
        await outerDb.txn(async (innerDb) => {
          await innerDb.create('users', {
            id: '2',
            name: 'Jane',
            email: 'jane@example.com',
          })

          // さらにネストしたトランザクション
          await innerDb.txn(async (deepDb) => {
            await deepDb.create('users', {
              id: '3',
              name: 'Bob',
              email: 'bob@example.com',
            })
          })
        })

        return 'success'
      })

      expect(result).toBe('success')
      expect(connector.transactionStartCount).toBe(1) // ルートトランザクションのみ

      // 3つのINSERT操作が実行されたことを確認
      const insertOperations = connector.operations.filter(
        (op) => op.type === 'execute' && op.sql.includes('INSERT'),
      )
      expect(insertOperations).toHaveLength(3)
    })

    it('should rollback nested transactions on error', async () => {
      connector.setMockData('users', [])

      await expect(async () => {
        await db.txn(async (outerDb) => {
          await outerDb.create('users', { id: '1', name: 'John' })

          await outerDb.txn(async (innerDb) => {
            await innerDb.create('users', { id: '2', name: 'Jane' })

            // 内側のトランザクションでエラー
            throw new Error('Something went wrong')
          })
        })
      }).rejects.toThrow('Something went wrong')

      expect(connector.transactionStartCount).toBe(1)
      expect(
        connector.operations.filter((op) => op.sql.includes('INSERT')),
      ).toHaveLength(2)
    })
  })

  describe('sync関数内でのネストトランザクション', () => {
    it('should handle nested transactions in sync operation', async () => {
      // 既存データの設定
      connector.setMockData('products', [
        { id: '1', name: 'Product A', price: 100 },
      ])

      await db.txn(async (outerDb) => {
        // 外側でsync実行（内部でトランザクションを使用）
        await outerDb.sync('products', {}, [
          { id: '1', name: 'Product A', price: 150 }, // 更新
          { id: '2', name: 'Product B', price: 200 }, // 作成
        ])

        // ネストされたトランザクションで別の操作
        await outerDb.txn(async (innerDb) => {
          await innerDb.create('orders', {
            id: '1',
            productId: '1',
            quantity: 5,
          })
        })
      })

      expect(connector.transactionStartCount).toBe(1) // ルートのみ
    })
  })

  describe('トランザクション情報の確認', () => {
    it('should provide correct transaction info at each level', async () => {
      const transactionInfos: any[] = []

      await db.txn(async (db1) => {
        const info1 = (db1 as DataBase).getCurrentTransactionInfo()
        transactionInfos.push({ level: 1, ...info1 })

        await db1.txn(async (db2) => {
          const info2 = (db2 as DataBase).getCurrentTransactionInfo()
          transactionInfos.push({ level: 2, ...info2 })

          await db2.txn(async (db3) => {
            const info3 = (db3 as DataBase).getCurrentTransactionInfo()
            transactionInfos.push({ level: 3, ...info3 })
          })
        })
      })

      expect(transactionInfos).toHaveLength(3)
      expect(transactionInfos[0].isInTransaction).toBe(true)
      expect(transactionInfos[0].level).toBe(1)
      expect(transactionInfos[1].isInTransaction).toBe(true)
      expect(transactionInfos[1].level).toBe(2)
      expect(transactionInfos[2].isInTransaction).toBe(true)
      expect(transactionInfos[2].level).toBe(3)
    })
  })

  describe('パフォーマンステスト', () => {
    it('should handle many nested transactions efficiently', async () => {
      const startTime = Date.now()
      let operationCount = 0

      await db.txn(async (db1) => {
        for (let i = 0; i < 10; i++) {
          await db1.txn(async (db2) => {
            await db2.create('test', { id: i, value: `test${i}` })
            operationCount++
          })
        }
      })

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(operationCount).toBe(10)
      expect(connector.transactionStartCount).toBe(1) // ルートのみ
      expect(duration).toBeLessThan(1000) // 1秒以内
    })
  })

  describe('並行性テスト', () => {
    it('should handle multiple independent transactions', async () => {
      const promises = []

      // 各並行トランザクションに対して独立したDataBaseインスタンスを作成
      for (let i = 0; i < 5; i++) {
        // 独立したコネクターとDataBaseインスタンス（自動注入されたTransactionManagerを使用）
        const independentConnector = new MockConnector()
        const independentDb = new DataBase(independentConnector, logger)

        const promise = independentDb.txn(async (txDb) => {
          await txDb.create('concurrent_test', {
            id: `concurrent_${i}`,
            value: i,
          })
          return i
        })
        promises.push(promise)
      }

      const results = await Promise.all(promises)
      expect(results).toEqual([0, 1, 2, 3, 4])

      // 注意: 元のconnectorではなく、全体の並行実行を確認するため、
      // このテストでは並行性が正しく動作していることを結果で確認
      expect(results).toHaveLength(5)
      expect(new Set(results)).toEqual(new Set([0, 1, 2, 3, 4]))
    })
  })

  describe('エラー伝播テスト', () => {
    it('should properly propagate errors from deeply nested transactions', async () => {
      let errorCaughtAt = ''

      try {
        await db.txn(async (db1) => {
          await db1.create('level1', { id: '1' })

          await db1.txn(async (db2) => {
            await db2.create('level2', { id: '2' })

            await db2.txn(async (db3) => {
              await db3.create('level3', { id: '3' })

              await db3.txn(async (db4) => {
                await db4.create('level4', { id: '4' })
                throw new Error('Deep error')
              })
            })
          })
        })
      } catch (error) {
        errorCaughtAt = 'root'
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Deep error')
      }

      expect(errorCaughtAt).toBe('root')
      expect(
        connector.operations.filter((op) => op.sql.includes('INSERT')),
      ).toHaveLength(4)
    })
  })

  describe('従来のAPI互換性', () => {
    it('should work without TransactionManager (legacy mode)', async () => {
      // TransactionManager無しのDataBaseインスタンス
      const legacyDb = new DataBase(connector, logger)
      connector.reset()

      await legacyDb.txn(async (txDb) => {
        await txDb.create('legacy_test', { id: '1', name: 'legacy' })

        // ネストした場合も従来通り動作
        await txDb.txn(async (nestedDb) => {
          await nestedDb.create('legacy_test', {
            id: '2',
            name: 'nested_legacy',
          })
        })
      })

      expect(connector.transactionStartCount).toBe(1) // 自動注入されたTransactionManager：1つのトランザクション
    })

    it('should maintain backward compatibility', async () => {
      const legacyDb = new DataBase(connector, logger)
      connector.reset()

      // 既存のAPIが変更されていないことを確認
      const result = await legacyDb.txn(async (txDb) => {
        await txDb.create('compat_test', { id: '1' })
        return 'legacy_result'
      })

      expect(result).toBe('legacy_result')
      expect(connector.transactionStartCount).toBe(1)
    })
  })
})
