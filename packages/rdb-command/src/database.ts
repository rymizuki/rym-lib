import {
  createBuilder,
  createConditions,
  SQLBuilderToSQLInputOptions,
} from 'coral-sql'

import {
  DataBaseCommandOptionsPartial,
  DataBaseConnectorPort,
  DataBaseContext,
  DataBaseLogger,
  DataBaseMiddleware,
  DataBasePort,
  SyncOptions,
  SyncResult,
  WhereType,
} from './interfaces'
import { TransactionManager, TransactionOptions } from './transaction-manager'

function escape(value: string, options: { quote?: string | null } = {}) {
  const quote =
    options.quote === null
      ? ''
      : options.quote !== undefined
        ? options.quote
        : '`'
  return `${quote}${encodeURIComponent(value)}${quote}`
}

export class DataBase implements DataBasePort {
  private middlewares: DataBaseMiddleware[] = []
  private context: DataBaseContext
  private toSqlOptions: SQLBuilderToSQLInputOptions
  private transactionManager?: TransactionManager

  constructor(
    private conn: DataBaseConnectorPort,
    private logger: DataBaseLogger,
    options: SQLBuilderToSQLInputOptions = {},
    transactionManager?: TransactionManager,
  ) {
    this.context = { logger }
    this.toSqlOptions = {
      ...{ placeholder: '$' },
      ...options,
    }
    this.transactionManager = transactionManager
  }

  async findOrCreate<Row>(
    table: string,
    where: Record<string, unknown>,
    data: Record<string, unknown>,
    options: DataBaseCommandOptionsPartial = {},
  ): Promise<Row> {
    const row = await this.find<Row>(table, where)
    if (row) return row
    await this.create(table, { ...data }, options)
    const ret = await this.find<Row>(table, where)
    if (!ret) {
      throw new Error(
        `record creation failed. table: ${table}, cond: ${JSON.stringify(
          where,
        )}`,
      )
    }
    return ret
  }

  async updateOrCreate(
    table: string,
    where: Record<string, unknown>,
    update: Record<string, unknown>,
    create: Record<string, unknown>,
    options: DataBaseCommandOptionsPartial = {},
  ): Promise<void> {
    const row = await this.find(table, where)
    if (!row) {
      await this.create(table, { ...create }, options)
    } else {
      await this.update(table, where, update, options)
    }
  }

  async create(
    table: string,
    data: Record<string, unknown>,
    options: DataBaseCommandOptionsPartial = {},
  ) {
    const columns = Object.keys(data)
      .map((prop) => escape(prop, this.toSqlOptions))
      .join(',')
    const replacements = Object.values(this.parse(data))

    const sql = `INSERT INTO ${escape(
      table,
      this.toSqlOptions,
    )} (${columns}) VALUES (${replacements
      .map((_, index) => `$${index + 1}`)
      .join(',')})`
    this.context.logger.debug(`[DataBase] create: ${sql} `, { replacements })

    await this.execute(sql, replacements, options)
  }

  async update(
    table: string,
    where: Record<string, unknown>,
    data: Record<string, unknown>,
    options: DataBaseCommandOptionsPartial = {},
  ) {
    const cond = this.createCondition(where)
    const [cond_sql, bindings] = cond.toSQL(this.toSqlOptions)
    const setters = Object.keys(data)
      .map(
        (prop, index) =>
          `${escape(prop, this.toSqlOptions)} = $${
            bindings.length + index + 1
          }`,
      )
      .join(', ')
    const values = Object.values(this.parse(data))

    const sql = `UPDATE ${escape(
      table,
      this.toSqlOptions,
    )} SET ${setters} WHERE ${cond_sql}`
    const replacements = [...bindings, ...values]
    this.context.logger.debug(`[DataBase] update: ${sql} `, {
      replacements,
    })
    await this.execute(sql, replacements, options)
  }

  async delete(
    table: string,
    where: Record<string, unknown>,
    options: DataBaseCommandOptionsPartial = {},
  ): Promise<void> {
    const cond = this.createCondition(where)
    const [cond_sql, replacements] = cond.toSQL(this.toSqlOptions)
    const sql = `DELETE FROM ${escape(
      table,
      this.toSqlOptions,
    )} WHERE ${cond_sql}`
    await this.execute(sql, replacements, options)
  }

  async find<Row>(
    table: string,
    where: Record<string, unknown>,
    options: DataBaseCommandOptionsPartial = {},
  ): Promise<Row | null> {
    const builder = createBuilder().from(table).limit(1)
    const cond = this.createCondition(where)
    const [sql, replacements] = builder.where(cond).toSQL(this.toSqlOptions)

    const rows = await this.query<Row>(sql, replacements, options)
    if (!rows.length) {
      return null
    }

    return rows[0] ?? null
  }

  async txn<T>(
    fn: (db: DataBasePort) => Promise<T>,
    options?: TransactionOptions
  ): Promise<T> {
    // TransactionManagerが設定されている場合は使用
    if (this.transactionManager) {
      return await this.transactionManager.runInTransaction(this, fn, options)
    }

    // 従来の実装（後方互換性のため）
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: { value: any } = { value: null }
    await this.conn.transaction(async (conn) => {
      const db = new DataBase(conn, this.context.logger, this.toSqlOptions, this.transactionManager)
      for (const middleware of this.middlewares) {
        db.use(middleware)
      }
      result.value = await fn(db)
    })
    return result.value
  }

  use(middleware: DataBaseMiddleware) {
    this.middlewares.push(middleware)
    return this
  }

  /**
   * TransactionManagerを設定してネストトランザクション対応を有効化
   */
  withTransactionManager(transactionManager: TransactionManager): DataBase {
    return new DataBase(this.conn, this.context.logger, this.toSqlOptions, transactionManager)
  }

  /**
   * 現在のトランザクション情報を取得
   */
  getCurrentTransactionInfo(): {
    isInTransaction: boolean
    contextId?: string
    level?: number
  } {
    if (!this.transactionManager) {
      return { isInTransaction: false }
    }

    const context = this.transactionManager.getCurrentContext(this)
    if (!context) {
      return { isInTransaction: false }
    }

    return {
      isInTransaction: true,
      contextId: context.id,
      level: context.level
    }
  }

  async sync<Row extends Record<string, unknown>>(
    table: string,
    where: WhereType,
    records: Array<Record<string, unknown>>,
    options: SyncOptions = {},
  ): Promise<SyncResult<Row>> {
    const { key, pk, noDeleteUnmatched = false } = options

    return await this.txn(async (txDb) => {
      // 1. where条件に一致する現在のレコードを取得
      const existingRecords = await txDb.getRecords<Row>(table, where)

      // 2. レコードの比較とグループ分け
      const { toCreate, toKeep, toDelete } = (txDb as DataBase).compareRecords(
        records,
        existingRecords,
        key,
      )

      // 3. 新規作成（PKの生成が必要な場合）
      const created: Row[] = []
      for (const record of toCreate) {
        const recordToCreate =
          pk?.generator && pk.column && !record[pk.column]
            ? { ...record, [pk.column]: pk.generator() }
            : record
        await txDb.create(table, recordToCreate)
        const newRecord = await txDb.find<Row>(table, recordToCreate)
        if (newRecord) created.push(newRecord)
      }

      // 4. 削除処理（noDeleteUnmatched=falseの場合のみ）
      const deleted: Row[] = []
      if (!noDeleteUnmatched) {
        for (const record of toDelete) {
          deleted.push(record as Row)
          // where条件の範囲内でのみ削除
          const deleteCondition = (txDb as DataBase).mergeWhere(where, record)
          await txDb.delete(table, deleteCondition)
        }
      }

      return {
        created,
        unchanged: toKeep as Row[],
        deleted,
      }
    })
  }

  private parse(record: Record<string, unknown>) {
    return record
  }

  private async getRecords<Row extends Record<string, unknown>>(
    table: string,
    where: WhereType,
  ): Promise<Row[]> {
    const builder = createBuilder().from(table)
    const cond = this.createCondition(where)
    const [sql, replacements] = builder.where(cond).toSQL(this.toSqlOptions)

    return await this.query<Row>(sql, replacements, {})
  }

  private compareRecords(
    inputRecords: Array<Record<string, unknown>>,
    existingRecords: Array<Record<string, unknown>>,
    key?: string | string[],
  ) {
    const toCreate: Array<Record<string, unknown>> = []
    const toKeep: Array<Record<string, unknown>> = []
    const toDelete: Array<Record<string, unknown>> = []

    // keyが指定されていない場合は全プロパティで比較
    if (!key) {
      for (const inputRecord of inputRecords) {
        const found = existingRecords.find((existingRecord) =>
          this.deepEqual(inputRecord, existingRecord),
        )
        if (found) {
          toKeep.push(found)
        } else {
          toCreate.push(inputRecord)
        }
      }

      for (const existingRecord of existingRecords) {
        const found = inputRecords.find((inputRecord) =>
          this.deepEqual(inputRecord, existingRecord),
        )
        if (!found) {
          toDelete.push(existingRecord)
        }
      }
    } else {
      // keyが指定されている場合は指定されたフィールドのみで比較
      const keyFields = Array.isArray(key) ? key : [key]

      for (const inputRecord of inputRecords) {
        const found = existingRecords.find((existingRecord) =>
          this.keyEqual(inputRecord, existingRecord, keyFields),
        )
        if (found) {
          toKeep.push(found)
        } else {
          toCreate.push(inputRecord)
        }
      }

      for (const existingRecord of existingRecords) {
        const found = inputRecords.find((inputRecord) =>
          this.keyEqual(inputRecord, existingRecord, keyFields),
        )
        if (!found) {
          toDelete.push(existingRecord)
        }
      }
    }

    return { toCreate, toKeep, toDelete }
  }

  private deepEqual(
    obj1: Record<string, unknown>,
    obj2: Record<string, unknown>,
  ): boolean {
    // キーの集合を取得（両方のオブジェクトの全キーを含む）
    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)])
    
    for (const key of allKeys) {
      // 一方にしか存在しないキー、または値が異なる場合は不一致
      if (obj1[key] !== obj2[key]) {
        return false
      }
    }

    return true
  }

  private keyEqual(
    obj1: Record<string, unknown>,
    obj2: Record<string, unknown>,
    keyFields: string[],
  ): boolean {
    for (const field of keyFields) {
      if (obj1[field] !== obj2[field]) {
        return false
      }
    }
    return true
  }

  private mergeWhere(
    baseWhere: WhereType,
    record: Record<string, unknown>,
  ): WhereType {
    return { ...baseWhere, ...record }
  }

  private createCondition(where: WhereType) {
    const data = this.parse(where)
    const cond = Object.keys(data).reduce(
      (cond, prop) => cond.and(prop, data[prop] as string),
      createConditions(),
    )
    return cond
  }

  private async query<T>(
    sql: string,
    replacements: unknown[],
    options: DataBaseCommandOptionsPartial,
  ) {
    let payload = { sql, replacements }
    for (const { preprocess } of this.middlewares) {
      if (!preprocess) continue
      payload = await preprocess(payload, options, this.context)
    }
    this.context.logger.debug(`[DataBase] query: ${payload.sql} `, {
      replacements: payload.replacements,
    })
    return await this.conn.query<T>(payload.sql, payload.replacements)
  }

  private async execute(
    sql: string,
    replacements: unknown[],
    options: DataBaseCommandOptionsPartial,
  ) {
    let payload = { sql, replacements }
    for (const { preprocess } of this.middlewares) {
      if (!preprocess) continue
      payload = await preprocess(payload, options, this.context)
    }
    this.context.logger.debug(`[DataBase] execute: ${payload.sql} `, {
      replacements: payload.replacements,
    })
    await this.conn.execute(payload.sql, payload.replacements)
  }
}
