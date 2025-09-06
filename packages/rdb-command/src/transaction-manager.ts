import type { DataBasePort, DataBaseConnectorPort, TransactionOptions } from './interfaces'

/**
 * トランザクションコンテキスト
 * 各トランザクションの状態と階層情報を保持
 */
export interface TransactionContext {
  /** 一意識別子 */
  id: string
  /** ネストレベル（1がルート） */
  level: number
  /** データベース接続参照 */
  conn: DataBaseConnectorPort
  /** 開始時刻 */
  startedAt: Date
  /** 親トランザクションID */
  parentId?: string
  /** 子トランザクションIDの集合 */
  children: Set<string>
  /** メタデータ（デバッグ情報等） */
  metadata: Map<string, any>
}


/**
 * トランザクションマネージャー
 * トランザクションのライフサイクルとネスト管理を担当
 */
export class TransactionManager {
  /** アクティブなトランザクションコンテキストの管理 */
  private readonly contexts = new Map<string, TransactionContext>()
  
  /** 接続とコンテキストのマッピング（自動GC対応） */
  private readonly connToContext = new WeakMap<DataBaseConnectorPort, TransactionContext>()
  
  /** DataBaseインスタンスと現在のコンテキストIDのマッピング */
  private readonly dbToCurrentContext = new WeakMap<DataBasePort, string>()
  
  /** デフォルトオプション */
  private readonly defaultOptions: Required<TransactionOptions> = {
    parentContextId: '',
    metadata: {},
    warningThreshold: 10000 // 10秒
  }

  /**
   * トランザクション内で関数を実行
   */
  async runInTransaction<T>(
    db: DataBasePort,
    fn: (db: DataBasePort) => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options }
    const startTime = Date.now()
    
    try {
      const existingContext = opts.parentContextId ? 
        this.contexts.get(opts.parentContextId) : 
        this.getCurrentContext(db)

      if (existingContext) {
        // ネストされたトランザクション：既存コンテキストを使用
        return await this.executeNested(
          db, 
          fn, 
          existingContext, 
          opts, 
          startTime
        )
      } else {
        // ルートトランザクション：新規開始
        return await this.executeRoot(db, fn, opts, startTime)
      }
    } catch (error) {
      const duration = Date.now() - startTime
      console.error('Transaction failed', {
        duration,
        metadata: opts.metadata,
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  /**
   * 現在のアクティブなトランザクションコンテキストを取得
   */
  getCurrentContext(db?: DataBasePort): TransactionContext | undefined {
    if (!db) return undefined
    
    // まず、DataBaseインスタンスから現在のコンテキストIDを取得
    const currentContextId = this.dbToCurrentContext.get(db)
    if (currentContextId) {
      const context = this.contexts.get(currentContextId)
      // コンテキストが存在しない場合はマッピングを削除
      if (!context) {
        this.dbToCurrentContext.delete(db)
        return undefined
      }
      return context
    }
    
    // フォールバック：接続を使用して検索
    const conn = (db as any).conn as DataBaseConnectorPort
    const context = this.connToContext.get(conn)
    
    // WeakMapで見つからない場合、すべてのコンテキストから検索
    if (!context) {
      for (const [, ctx] of this.contexts) {
        if (ctx.conn === conn) {
          return ctx
        }
      }
    }
    
    return context
  }

  /**
   * アクティブなトランザクションがあるかチェック
   */
  hasActiveTransaction(db?: DataBasePort): boolean {
    return this.getCurrentContext(db) !== undefined
  }

  /**
   * 統計情報を取得
   */
  getStats(): {
    activeTransactions: number
    contexts: Array<{
      id: string
      level: number
      duration: number
      childrenCount: number
    }>
  } {
    const now = Date.now()
    return {
      activeTransactions: this.contexts.size,
      contexts: Array.from(this.contexts.values()).map(ctx => ({
        id: ctx.id,
        level: ctx.level,
        duration: now - ctx.startedAt.getTime(),
        childrenCount: ctx.children.size
      }))
    }
  }

  /**
   * リソースのクリーンアップ
   */
  destroy(): void {
    this.contexts.clear()
  }

  /**
   * ルートトランザクションを実行
   */
  private async executeRoot<T>(
    db: DataBasePort,
    fn: (db: DataBasePort) => Promise<T>,
    options: Required<TransactionOptions>,
    startTime: number
  ): Promise<T> {
    const result: { value: T | null } = { value: null }
    
    // DataBaseの基礎となるconnectorを直接使用してトランザクションを開始
    const conn = (db as any).conn as DataBaseConnectorPort
    
    await conn.transaction(async (txConn) => {
      const context = this.createContext(
        txConn,
        undefined,
        options.metadata
      )
      
      this.connToContext.set(context.conn, context)
      
      let txDb: any = null
      
      try {
        console.debug(`[TransactionManager] Root transaction started: ${context.id}`)
        
        // 新しいDataBaseインスタンスを作成（TransactionManager無しで無限再帰を防ぐ）
        const logger = (db as any).context.logger
        const toSqlOptions = (db as any).toSqlOptions
        const middlewares = (db as any).middlewares || []
        
        // DataBase classを動的にimportして循環依存を回避
        const { DataBase } = await import('./database.js')
        txDb = new DataBase(txConn, logger, { ...toSqlOptions, transactionManager: this }) // TransactionManagerを設定
        for (const middleware of middlewares) {
          txDb.use(middleware)
        }
        
        // DataBaseインスタンスに現在のコンテキストを関連付け
        this.dbToCurrentContext.set(txDb, context.id)
        
        result.value = await fn(txDb)
        
        const duration = Date.now() - startTime
        if (duration > options.warningThreshold) {
          console.warn(`Long transaction detected: ${duration}ms`, {
            contextId: context.id,
            metadata: options.metadata
          })
        }
        
        console.debug(`[TransactionManager] Root transaction completed: ${context.id} (${duration}ms)`)
      } finally {
        this.removeContext(context.id)
        // connToContextからも削除
        this.connToContext.delete(context.conn)
        // DataBaseインスタンスのマッピングをクリア
        if (txDb) {
          this.dbToCurrentContext.delete(txDb)
        }
        // 元のDataBaseインスタンスのマッピングもクリア
        this.dbToCurrentContext.delete(db)
      }
    })
    
    return result.value!
  }

  /**
   * ネストされたトランザクションを実行
   */
  private async executeNested<T>(
    db: DataBasePort,
    fn: (db: DataBasePort) => Promise<T>,
    parentContext: TransactionContext,
    options: Required<TransactionOptions>,
    startTime: number
  ): Promise<T> {
    const childContext = this.createContext(
      parentContext.conn,
      parentContext.id,
      options.metadata
    )
    
    try {
      console.debug(`[TransactionManager] Nested transaction started: ${childContext.id} (level: ${childContext.level})`)
      
      // ネストされたトランザクションでは、元のDataBaseインスタンスを使用
      // ただし、コンテキストは子コンテキストを示すように更新
      this.dbToCurrentContext.set(db, childContext.id)
      
      try {
        const result = await fn(db)
        
        const duration = Date.now() - startTime
        if (duration > options.warningThreshold) {
          console.warn(`Long nested transaction detected: ${duration}ms`, {
            contextId: childContext.id,
            parentId: parentContext.id,
            level: childContext.level,
            metadata: options.metadata
          })
        }
        
        console.debug(`[TransactionManager] Nested transaction completed: ${childContext.id} (${duration}ms)`)
        
        return result
      } finally {
        // ネスト完了後は親コンテキストに戻す
        this.dbToCurrentContext.set(db, parentContext.id)
      }
    } catch (error) {
      console.error(`[TransactionManager] Nested transaction failed: ${childContext.id}`, {
        parentId: parentContext.id,
        level: childContext.level,
        error: error instanceof Error ? error.message : error
      })
      throw error
    } finally {
      this.removeContext(childContext.id)
    }
  }

  /**
   * トランザクションコンテキストを作成
   */
  private createContext(
    conn: DataBaseConnectorPort,
    parentId?: string,
    metadata: Record<string, any> = {}
  ): TransactionContext {
    const id = crypto.randomUUID()
    const parentContext = parentId ? this.contexts.get(parentId) : undefined
    
    const context: TransactionContext = {
      id,
      level: parentContext ? parentContext.level + 1 : 1,
      conn,
      startedAt: new Date(),
      parentId,
      children: new Set(),
      metadata: new Map(Object.entries(metadata))
    }
    
    this.contexts.set(id, context)
    
    if (parentContext) {
      parentContext.children.add(id)
    }
    
    return context
  }

  /**
   * トランザクションコンテキストを削除
   */
  private removeContext(id: string): void {
    const context = this.contexts.get(id)
    if (!context) return

    // 子コンテキストを再帰的に削除
    context.children.forEach(childId => {
      this.removeContext(childId)
    })

    // 親から自身を削除
    if (context.parentId) {
      const parent = this.contexts.get(context.parentId)
      parent?.children.delete(id)
    }

    this.contexts.delete(id)
  }
}