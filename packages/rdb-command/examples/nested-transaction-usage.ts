/**
 * rdb-commandのネストトランザクション使用例
 *
 * このファイルは、TransactionManagerを使用したネストトランザクション機能の
 * 使用方法を示すサンプルです。
 */
import { PrismaClient } from '@prisma/client'

import { DataBase, TransactionManager } from '../src'
import { PrismaConnector } from '../src/connectors/prisma'

// ログ実装例
class ConsoleLogger {
  debug(format: string, ...args: unknown[]): void {
    console.log(`[DEBUG] ${format}`, ...args)
  }
  info(format: string, ...args: unknown[]): void {
    console.info(`[INFO] ${format}`, ...args)
  }
  warning(format: string, ...args: unknown[]): void {
    console.warn(`[WARN] ${format}`, ...args)
  }
  error(format: string, ...args: unknown[]): void {
    console.error(`[ERROR] ${format}`, ...args)
  }
  critical(format: string, ...args: unknown[]): void {
    console.error(`[CRITICAL] ${format}`, ...args)
  }
}

async function main() {
  const prisma = new PrismaClient()
  const connector = new PrismaConnector(prisma)
  const logger = new ConsoleLogger()
  const transactionManager = new TransactionManager()

  // TransactionManagerを使用したDataBaseインスタンス
  const db = new DataBase(connector, logger, {}, transactionManager)

  console.log('=== ネストトランザクションの使用例 ===\n')

  try {
    // 例1: 基本的なネストトランザクション
    console.log('例1: 基本的なネストトランザクション')
    await db.txn(async (outerDb) => {
      console.log('外側のトランザクション開始')

      await outerDb.create('users', {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
      })

      // ネストされたトランザクション
      await outerDb.txn(async (innerDb) => {
        console.log('内側のトランザクション開始')

        await innerDb.create('profiles', {
          userId: '1',
          bio: 'Software Developer',
        })

        console.log('内側のトランザクション完了')
      })

      console.log('外側のトランザクション完了')
    })

    // 例2: エラーハンドリング
    console.log('\n例2: エラーハンドリング')
    try {
      await db.txn(async (outerDb) => {
        await outerDb.create('users', {
          id: '2',
          name: 'Jane Doe',
          email: 'jane@example.com',
        })

        await outerDb.txn(async (innerDb) => {
          await innerDb.create('profiles', {
            userId: '2',
            bio: 'Designer',
          })

          // エラーを発生させる
          throw new Error('意図的なエラー')
        })
      })
    } catch (error) {
      console.log('エラーをキャッチ:', (error as Error).message)
      console.log('全体がロールバックされます')
    }

    // 例3: 深いネスト
    console.log('\n例3: 深いネスト（3レベル）')
    await db.txn(async (level1Db) => {
      console.log('レベル1開始')

      await level1Db.txn(async (level2Db) => {
        console.log('レベル2開始')

        await level2Db.txn(async (level3Db) => {
          console.log('レベル3開始')

          // 現在のトランザクション情報を取得
          const info = (level3Db as DataBase).getCurrentTransactionInfo()
          console.log('トランザクション情報:', {
            isInTransaction: info.isInTransaction,
            level: info.level,
            contextId: info.contextId?.slice(0, 8) + '...',
          })

          console.log('レベル3完了')
        })

        console.log('レベル2完了')
      })

      console.log('レベル1完了')
    })

    // 例4: sync関数内でのネスト
    console.log('\n例4: sync関数内でのネストトランザクション')
    await db.txn(async (outerDb) => {
      // sync関数は内部でトランザクションを使用するが、
      // 既存のトランザクションコンテキストを利用する
      await outerDb.sync('products', {}, [
        { id: '1', name: 'Product A', price: 100 },
        { id: '2', name: 'Product B', price: 200 },
      ])

      // 追加の操作をネストしたトランザクションで実行
      await outerDb.txn(async (innerDb) => {
        await innerDb.create('categories', {
          id: '1',
          name: 'Electronics',
        })
      })
    })

    // 例5: TransactionManagerの統計情報
    console.log('\n例5: 統計情報の取得')
    await db.txn(async (db1) => {
      await db1.txn(async (db2) => {
        await db2.txn(async () => {
          const stats = transactionManager.getStats()
          console.log(
            'アクティブなトランザクション数:',
            stats.activeTransactions,
          )
          console.log(
            'コンテキスト詳細:',
            stats.contexts.map((ctx) => ({
              id: ctx.id.slice(0, 8) + '...',
              level: ctx.level,
              duration: `${ctx.duration}ms`,
            })),
          )
        })
      })
    })
  } catch (error) {
    console.error('予期しないエラー:', error)
  } finally {
    // リソースのクリーンアップ
    transactionManager.destroy()
    await prisma.$disconnect()
  }
}

// 従来のAPI（TransactionManager無し）の使用例
async function legacyExample() {
  const prisma = new PrismaClient()
  const connector = new PrismaConnector(prisma)
  const logger = new ConsoleLogger()

  // TransactionManager無しのDataBase（従来通り）
  const db = new DataBase(connector, logger)

  console.log('\n=== 従来のAPI使用例（互換性確認） ===\n')

  try {
    await db.txn(async (outerDb) => {
      console.log('従来の外側トランザクション')

      await outerDb.txn(async (innerDb) => {
        console.log(
          '従来の内側トランザクション（別のPrismaトランザクションが開始される）',
        )
      })
    })

    console.log('従来のAPI動作確認完了')
  } catch (error) {
    console.error('従来のAPIエラー:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 実行
if (require.main === module) {
  main()
    .then(() => legacyExample())
    .then(() => {
      console.log('\n全ての例が完了しました')
      process.exit(0)
    })
    .catch((error) => {
      console.error('実行エラー:', error)
      process.exit(1)
    })
}
