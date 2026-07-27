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
  DataBaseOptions,
  DataBasePort,
  SyncOptions,
  SyncResult,
  TransactionOptions,
  WhereType,
} from './interfaces'
import { TransactionManager } from './transaction-manager'
import { isRawExpression } from './upsert/is-raw-expression'
import { UpsertConflict } from './upsert/upsert-conflict'
import { UpsertData } from './upsert/upsert-data'
import { UpsertOptions } from './upsert/upsert-options'
import { UpsertResult } from './upsert/upsert-result'
import { UpsertValue } from './upsert/upsert-value'

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
  private transactionManager: TransactionManager

  constructor(
    private conn: DataBaseConnectorPort,
    private logger: DataBaseLogger,
    options: DataBaseOptions = {},
  ) {
    this.context = { logger }

    // SQLオプションからtransactionManagerを除外
    const { transactionManager, ...sqlOptions } = options
    this.toSqlOptions = {
      // placeholderが指定されていない場合はデフォルトで'$'を使用
      // MySQLの場合は明示的に placeholder: '?' を指定する必要がある
      placeholder: '$' as const,
      ...sqlOptions,
    }

    // TransactionManagerが未指定の場合、新しいインスタンスを自動作成
    this.transactionManager =
      transactionManager || new TransactionManager(this.context)
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

  /**
   * SELECT で存在確認し、無ければ create / 有れば update する。
   *
   * NOTE: これは非原子的な 2 ステップ（find → create/update）であり、同時実行下の
   *       競合には無防備。一意制約に対する原子的な upsert が必要なら {@link upsert}
   *       （INSERT ... ON CONFLICT）を使うこと。`updateOrCreate` は任意の where で
   *       検索できる（一意制約を要さない）点が upsert と異なる。
   */
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
      return
    }
    await this.update(table, where, update, options)
  }

  /**
   * INSERT ... ON CONFLICT を発行する原子的 upsert。
   *
   * NOTE: **PostgreSQL 専用**（`ON CONFLICT` 構文と `$n` placeholder に依存）。
   *       MySQL（`placeholder: '?'`）は `ON DUPLICATE KEY UPDATE` を要し採番方式も
   *       異なるため、`?` placeholder で呼ばれた場合は例外にする。
   * NOTE: `table` / `data` の列名 / `conflict.target` / `options.returning` の列名、
   *       および `raw()` の `sql` ・ `cast()` の型名は、**識別子/式としてエスケープせず
   *       埋め込む**（バインドされるのは値のみ）。これらには信頼できるリテラルのみを渡し、
   *       ユーザー入力を渡さないこと（インジェクション防止）。バインド値（通常の
   *       `UpsertValue`）は placeholder 経由で安全に渡る。
   *
   * @see updateOrCreate 非原子的 2 ステップ版（競合が問題にならない場合の代替）
   */
  async upsert<Row>(
    table: string,
    data: UpsertData,
    conflict: UpsertConflict,
    options: UpsertOptions = {},
  ): Promise<UpsertResult<Row>> {
    if ((this.toSqlOptions.placeholder || '$') === '?') {
      throw new Error(
        'upsert supports PostgreSQL ($n placeholder) only; MySQL is not supported',
      )
    }

    const entries = Object.entries(this.parse(data))
    if (entries.length === 0) {
      throw new Error('upsert requires at least one column in data')
    }
    if (conflict.target.length === 0) {
      throw new Error('upsert requires at least one conflict target column')
    }

    const replacements: unknown[] = []

    const columnsSql = entries
      .map(([prop]) => escape(prop, this.toSqlOptions))
      .join(',')
    const valuesSql = entries
      .map(([, value]) => this.renderValue(value as UpsertValue, replacements))
      .join(',')

    const conflictSql = this.renderConflict(conflict, replacements)
    const returningSql = this.renderReturning(options.returning)

    const sql = `INSERT INTO ${escape(
      table,
      this.toSqlOptions,
    )} (${columnsSql}) VALUES (${valuesSql})${conflictSql}${returningSql}`

    this.context.logger.debug(`[DataBase] upsert: ${sql} `, { replacements })

    if (options.returning !== undefined) {
      const rows = await this.query<Row>(sql, replacements, options)
      return { rows }
    }

    await this.execute(sql, replacements, options)
    return { rows: [] }
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
      .map((_, index) => this.getPlaceholder(index))
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
    const values = Object.values(this.parse(data))

    // MySQLの場合、placeholderは全て'?'になるため、
    // SQLの出現順序とreplacementsの順序を合わせる必要がある
    const placeholder = this.toSqlOptions.placeholder || '$'
    const isMySQL = placeholder === '?'

    const setters = Object.keys(data)
      .map(
        (prop, index) =>
          `${escape(prop, this.toSqlOptions)} = ${this.getPlaceholder(
            isMySQL ? index : bindings.length + index,
          )}`,
      )
      .join(', ')

    const sql = `UPDATE ${escape(
      table,
      this.toSqlOptions,
    )} SET ${setters} WHERE ${cond_sql}`

    // MySQLの場合は SET句の値が先、その後WHERE句の値
    // PostgreSQLの場合は元の順序を維持
    const replacements = isMySQL
      ? [...values, ...bindings]
      : [...bindings, ...values]

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
    options?: TransactionOptions,
  ): Promise<T> {
    // TransactionManagerは常に存在する（コンストラクターで自動作成）
    return await this.transactionManager.runInTransaction(this, fn, options)
  }

  use(middleware: DataBaseMiddleware) {
    this.middlewares.push(middleware)
    return this
  }

  /**
   * 現在のトランザクション情報を取得
   */
  getCurrentTransactionInfo(): {
    isInTransaction: boolean
    contextId?: string
    level?: number
  } {
    const context = this.transactionManager.getCurrentContext(this)
    if (!context) {
      return { isInTransaction: false }
    }

    return {
      isInTransaction: true,
      contextId: context.id,
      level: context.level,
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
      const existingRecords = await this.getRecords<Row>(table, where)

      // 2. レコードの比較とグループ分け
      const { toCreate, toKeep, toDelete } = this.compareRecords(
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
          const deleteCondition = this.mergeWhere(where, record)
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

  private getPlaceholder(index: number): string {
    const placeholder = this.toSqlOptions.placeholder || '$'
    if (placeholder === '?') {
      return '?'
    }
    return `${placeholder}${index + 1}`
  }

  /**
   * upsert の値を SQL 片へ描画する。通常値は 1 プレースホルダを消費し
   * `replacements` へ push、RawExpression は式内の `?` を採番置換して bindings を push。
   *
   * NOTE: 採番は `replacements.length` を index の基準にすることで、VALUES / SET /
   *       WHERE をまたいで一貫した連番（`$1, $2, ...`）になる。now() のように
   *       bindings を持たない式は `replacements` を増やさないため、後続の番号がずれない。
   */
  private renderValue(value: UpsertValue, replacements: unknown[]): string {
    if (isRawExpression(value)) {
      return this.renderRawSql(value.sql, value.bindings, replacements)
    }
    const sql = this.getPlaceholder(replacements.length)
    replacements.push(value)
    return sql
  }

  /**
   * RawExpression の `sql` 内の各 `?` を採番済みプレースホルダへ置換し、
   * bindings を順に `replacements` へ push する。
   */
  private renderRawSql(
    rawSql: string,
    bindings: unknown[],
    replacements: unknown[],
  ): string {
    const placeholderCount = (rawSql.match(/\?/g) ?? []).length
    if (placeholderCount !== bindings.length) {
      throw new Error(
        `raw expression placeholder count (${placeholderCount}) does not match bindings length (${bindings.length}): ${rawSql}`,
      )
    }

    const rendered = bindings.reduce<string>((sql, binding) => {
      const placeholder = this.getPlaceholder(replacements.length)
      replacements.push(binding)
      return sql.replace('?', placeholder)
    }, rawSql)

    return rendered
  }

  private renderConflict(
    conflict: UpsertConflict,
    replacements: unknown[],
  ): string {
    const target = conflict.target
      .map((prop) => escape(prop, this.toSqlOptions))
      .join(',')
    const targetWhere = conflict.targetWhere
      ? ` WHERE ${this.renderRawSql(
          conflict.targetWhere.sql,
          conflict.targetWhere.bindings,
          replacements,
        )}`
      : ''
    const action = this.renderAction(conflict.action, replacements)
    return ` ON CONFLICT (${target})${targetWhere} ${action}`
  }

  private renderAction(
    action: UpsertConflict['action'],
    replacements: unknown[],
  ): string {
    if (action.type === 'nothing') {
      return 'DO NOTHING'
    }
    const setLength = Array.isArray(action.set)
      ? action.set.length
      : Object.keys(action.set).length
    if (setLength === 0) {
      throw new Error('upsert DO UPDATE requires at least one column in set')
    }
    const setSql = Array.isArray(action.set)
      ? this.renderExcludedSet(action.set)
      : this.renderExplicitSet(action.set, replacements)
    return `DO UPDATE SET ${setSql}`
  }

  private renderExcludedSet(columns: string[]): string {
    return columns
      .map((prop) => {
        const col = escape(prop, this.toSqlOptions)
        return `${col} = excluded.${col}`
      })
      .join(', ')
  }

  private renderExplicitSet(
    set: UpsertData,
    replacements: unknown[],
  ): string {
    return Object.entries(set)
      .map(([prop, value]) => {
        const col = escape(prop, this.toSqlOptions)
        return `${col} = ${this.renderValue(value, replacements)}`
      })
      .join(', ')
  }

  private renderReturning(returning: UpsertOptions['returning']): string {
    if (returning === undefined) {
      return ''
    }
    if (returning === '*') {
      return ' RETURNING *'
    }
    const cols = returning
      .map((prop) => escape(prop, this.toSqlOptions))
      .join(',')
    return ` RETURNING ${cols}`
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
          this.shallowEqual(inputRecord, existingRecord),
        )
        if (found) {
          toKeep.push(found)
        } else {
          toCreate.push(inputRecord)
        }
      }

      for (const existingRecord of existingRecords) {
        const found = inputRecords.find((inputRecord) =>
          this.shallowEqual(inputRecord, existingRecord),
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

  private shallowEqual(
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
