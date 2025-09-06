/**
 * rdb-command Nested Transaction Usage Examples
 * 
 * This file demonstrates how to use the nested transaction functionality
 * with TransactionManager in rdb-command.
 */

import { DataBase, TransactionManager } from '../src'
import { PrismaConnector } from '../src/connectors/prisma'
import { PrismaClient } from '@prisma/client'

// Logger implementation example
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
  
  // DataBase instance with TransactionManager
  const db = new DataBase(connector, logger, {}, transactionManager)

  console.log('=== Nested Transaction Usage Examples ===\n')

  try {
    // Example 1: Basic nested transaction
    console.log('Example 1: Basic nested transaction')
    await db.txn(async (outerDb) => {
      console.log('Outer transaction started')
      
      await outerDb.create('users', {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com'
      })

      // Nested transaction
      await outerDb.txn(async (innerDb) => {
        console.log('Inner transaction started')
        
        await innerDb.create('profiles', {
          userId: '1',
          bio: 'Software Developer'
        })

        console.log('Inner transaction completed')
      })

      console.log('Outer transaction completed')
    })

    // Example 2: Error handling
    console.log('\nExample 2: Error handling')
    try {
      await db.txn(async (outerDb) => {
        await outerDb.create('users', {
          id: '2',
          name: 'Jane Doe',
          email: 'jane@example.com'
        })

        await outerDb.txn(async (innerDb) => {
          await innerDb.create('profiles', {
            userId: '2',
            bio: 'Designer'
          })

          // Trigger an error
          throw new Error('Intentional error')
        })
      })
    } catch (error) {
      console.log('Error caught:', (error as Error).message)
      console.log('Entire transaction will be rolled back')
    }

    // Example 3: Deep nesting (3 levels)
    console.log('\nExample 3: Deep nesting (3 levels)')
    await db.txn(async (level1Db) => {
      console.log('Level 1 started')
      
      await level1Db.txn(async (level2Db) => {
        console.log('Level 2 started')
        
        await level2Db.txn(async (level3Db) => {
          console.log('Level 3 started')
          
          // Get current transaction information
          const info = (level3Db as DataBase).getCurrentTransactionInfo()
          console.log('Transaction info:', {
            isInTransaction: info.isInTransaction,
            level: info.level,
            contextId: info.contextId?.slice(0, 8) + '...'
          })
          
          console.log('Level 3 completed')
        })
        
        console.log('Level 2 completed')
      })
      
      console.log('Level 1 completed')
    })

    // Example 4: Nested within sync function
    console.log('\nExample 4: Nested transaction within sync function')
    await db.txn(async (outerDb) => {
      // sync function uses transaction internally,
      // but will utilize existing transaction context
      await outerDb.sync('products', {}, [
        { id: '1', name: 'Product A', price: 100 },
        { id: '2', name: 'Product B', price: 200 }
      ])

      // Additional operations in nested transaction
      await outerDb.txn(async (innerDb) => {
        await innerDb.create('categories', {
          id: '1',
          name: 'Electronics'
        })
      })
    })

    // Example 5: TransactionManager statistics
    console.log('\nExample 5: Getting statistics')
    await db.txn(async (db1) => {
      await db1.txn(async (db2) => {
        await db2.txn(async () => {
          const stats = transactionManager.getStats()
          console.log('Active transactions:', stats.activeTransactions)
          console.log('Context details:', stats.contexts.map(ctx => ({
            id: ctx.id.slice(0, 8) + '...',
            level: ctx.level,
            duration: `${ctx.duration}ms`
          })))
        })
      })
    })

  } catch (error) {
    console.error('Unexpected error:', error)
  } finally {
    // Resource cleanup
    transactionManager.destroy()
    await prisma.$disconnect()
  }
}

// Legacy API usage example (TransactionManager-less)
async function legacyExample() {
  const prisma = new PrismaClient()
  const connector = new PrismaConnector(prisma)
  const logger = new ConsoleLogger()
  
  // DataBase without TransactionManager (legacy behavior)
  const db = new DataBase(connector, logger)

  console.log('\n=== Legacy API Usage Example (Compatibility Check) ===\n')

  try {
    await db.txn(async (outerDb) => {
      console.log('Legacy outer transaction')
      
      await outerDb.txn(async (innerDb) => {
        console.log('Legacy inner transaction (separate Prisma transaction will be started)')
      })
    })
    
    console.log('Legacy API operation completed')
  } catch (error) {
    console.error('Legacy API error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Execute
if (require.main === module) {
  main()
    .then(() => legacyExample())
    .then(() => {
      console.log('\nAll examples completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Execution error:', error)
      process.exit(1)
    })
}