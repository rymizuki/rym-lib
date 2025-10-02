import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  type MockInstance,
} from 'vitest'

import { DataBase } from './database'
import {
  DataBaseConnectorPort,
  DataBaseLogger,
  TransactionOptions,
} from './interfaces'
import { TransactionManager } from './transaction-manager'

class DummyDataBaseLogger implements DataBaseLogger {
  debug() {}
  info() {}
  warning() {}
  error() {}
  critical() {}
}

class TestConnector implements DataBaseConnectorPort {
  public transactionCalls: Array<
    (conn: DataBaseConnectorPort) => Promise<void>
  > = []
  public executeCalls: Array<{ sql: string; replacements: unknown[] }> = []

  async execute(sql: string, replacements: unknown[]): Promise<void> {
    this.executeCalls.push({ sql, replacements })
  }

  async query<T>(sql: string, replacements: unknown[]): Promise<T[]> {
    return []
  }

  async transaction(
    exec: (conn: DataBaseConnectorPort) => Promise<void>,
  ): Promise<void> {
    this.transactionCalls.push(exec)
    // モックトランザクション内では同じconnインスタンスを使用
    await exec(this)
  }
}

describe('TransactionManager', () => {
  let transactionManager: TransactionManager
  let connector: TestConnector
  let db: DataBase
  let logger: DataBaseLogger

  beforeEach(() => {
    connector = new TestConnector()
    logger = new DummyDataBaseLogger()
    const context = { logger }
    transactionManager = new TransactionManager(context)
    db = new DataBase(connector, logger, { transactionManager })
  })

  afterEach(() => {
    transactionManager.destroy()
  })

  describe('基本的なトランザクション機能', () => {
    it('should execute single transaction', async () => {
      let executed = false

      await transactionManager.runInTransaction(db, async (txDb) => {
        executed = true
        expect(txDb).toBeDefined()
        return 'success'
      })

      expect(executed).toBe(true)
      expect(connector.transactionCalls).toHaveLength(1)
    })

    it('should return transaction result', async () => {
      const result = await transactionManager.runInTransaction(db, async () => {
        return { value: 42 }
      })

      expect(result).toEqual({ value: 42 })
    })

    it('should propagate errors from transaction', async () => {
      const error = new Error('Transaction failed')

      await expect(async () => {
        await transactionManager.runInTransaction(db, async () => {
          throw error
        })
      }).rejects.toThrow('Transaction failed')
    })
  })

  describe('ネストされたトランザクション', () => {
    it('should handle nested transactions without creating additional Prisma transactions', async () => {
      let outerExecuted = false
      let innerExecuted = false

      await transactionManager.runInTransaction(db, async (outerDb) => {
        outerExecuted = true

        await transactionManager.runInTransaction(outerDb, async (innerDb) => {
          innerExecuted = true
          expect(innerDb).toBe(outerDb) // 同じインスタンスを使用
        })
      })

      expect(outerExecuted).toBe(true)
      expect(innerExecuted).toBe(true)
      // ルートトランザクションのみ実行される
      expect(connector.transactionCalls).toHaveLength(1)
    })

    it('should handle deep nesting', async () => {
      let level1 = false,
        level2 = false,
        level3 = false

      await transactionManager.runInTransaction(db, async (db1) => {
        level1 = true

        await transactionManager.runInTransaction(db1, async (db2) => {
          level2 = true

          await transactionManager.runInTransaction(db2, async (db3) => {
            level3 = true
          })
        })
      })

      expect(level1).toBe(true)
      expect(level2).toBe(true)
      expect(level3).toBe(true)
      expect(connector.transactionCalls).toHaveLength(1)
    })

    it('should propagate errors from nested transactions', async () => {
      await expect(async () => {
        await transactionManager.runInTransaction(db, async (db1) => {
          await transactionManager.runInTransaction(db1, async () => {
            throw new Error('Nested error')
          })
        })
      }).rejects.toThrow('Nested error')
    })
  })

  describe('コンテキスト管理', () => {
    it('should track transaction contexts', async () => {
      let contextInfo: any = null

      await transactionManager.runInTransaction(db, async (txDb) => {
        const context = transactionManager.getCurrentContext(txDb)
        contextInfo = {
          hasContext: !!context,
          id: context?.id,
          level: context?.level,
        }
      })

      expect(contextInfo.hasContext).toBe(true)
      expect(contextInfo.id).toBeDefined()
      expect(contextInfo.level).toBe(1)
    })

    it('should track nested levels correctly', async () => {
      const levels: number[] = []

      await transactionManager.runInTransaction(db, async (db1) => {
        const ctx1 = transactionManager.getCurrentContext(db1)
        levels.push(ctx1!.level)

        await transactionManager.runInTransaction(db1, async (db2) => {
          const ctx2 = transactionManager.getCurrentContext(db2)
          levels.push(ctx2!.level)

          await transactionManager.runInTransaction(db2, async (db3) => {
            const ctx3 = transactionManager.getCurrentContext(db3)
            levels.push(ctx3!.level)
          })
        })
      })

      expect(levels).toEqual([1, 2, 3])
    })

    it('should clean up contexts after transaction completion', async () => {
      await transactionManager.runInTransaction(db, async () => {
        // コンテキスト内
      })

      // トランザクション完了後
      expect(transactionManager.hasActiveTransaction(db)).toBe(false)
      const stats = transactionManager.getStats()
      expect(stats.activeTransactions).toBe(0)
    })
  })

  describe('オプション処理', () => {
    it('should accept transaction options', async () => {
      const options: TransactionOptions = {
        metadata: { operation: 'test' },
        warningThreshold: 5000,
      }

      const result = await transactionManager.runInTransaction(
        db,
        async () => 'success',
        options,
      )

      expect(result).toBe('success')
    })
  })

  describe('統計情報', () => {
    it('should provide transaction statistics', async () => {
      await transactionManager.runInTransaction(db, async () => {
        const stats = transactionManager.getStats()
        expect(stats.activeTransactions).toBe(1)
        expect(stats.contexts).toHaveLength(1)
        expect(stats.contexts[0].level).toBe(1)
      })
    })

    it('should track multiple nested contexts in stats', async () => {
      await transactionManager.runInTransaction(db, async (db1) => {
        await transactionManager.runInTransaction(db1, async (db2) => {
          await transactionManager.runInTransaction(db2, async () => {
            const stats = transactionManager.getStats()
            expect(stats.activeTransactions).toBe(3) // 親+子2つ
            const levels = stats.contexts.map((ctx) => ctx.level).sort()
            expect(levels).toEqual([1, 2, 3])
          })
        })
      })
    })
  })

  describe('DataBaseとの統合', () => {
    it('should work with DataBase.txn method', async () => {
      let executed = false

      const result = await db.txn(async (txDb) => {
        executed = true
        return 'db-txn-result'
      })

      expect(executed).toBe(true)
      expect(result).toBe('db-txn-result')
    })

    it('should handle nested db.txn calls', async () => {
      let outerExecuted = false
      let innerExecuted = false

      await db.txn(async (outerDb) => {
        outerExecuted = true

        await outerDb.txn(async (innerDb) => {
          innerExecuted = true
          expect(innerDb).toBe(outerDb)
        })
      })

      expect(outerExecuted).toBe(true)
      expect(innerExecuted).toBe(true)
      expect(connector.transactionCalls).toHaveLength(1)
    })

    it('should provide transaction info through DataBase', async () => {
      await db.txn(async (txDb) => {
        const info = (txDb as DataBase).getCurrentTransactionInfo()
        expect(info.isInTransaction).toBe(true)
        expect(info.contextId).toBeDefined()
        expect(info.level).toBe(1)
      })
    })
  })

  describe('エラーハンドリング', () => {
    it('should handle transaction timeout warnings', async () => {
      const loggerSpy = vi.spyOn(logger, 'warning').mockImplementation(() => {})

      await transactionManager.runInTransaction(
        db,
        async () => {
          // 短時間で完了するが、閾値を低く設定
          await new Promise((resolve) => setTimeout(resolve, 10))
          return 'success'
        },
        { warningThreshold: 5 },
      )

      expect(loggerSpy).toHaveBeenCalled()
      loggerSpy.mockRestore()
    })

    it('should handle errors in nested transactions properly', async () => {
      const loggerSpy = vi.spyOn(logger, 'error').mockImplementation(() => {})

      await expect(async () => {
        await transactionManager.runInTransaction(db, async (db1) => {
          await transactionManager.runInTransaction(db1, async () => {
            throw new Error('Inner failure')
          })
        })
      }).rejects.toThrow('Inner failure')

      expect(loggerSpy).toHaveBeenCalled()
      loggerSpy.mockRestore()
    })
  })
})
