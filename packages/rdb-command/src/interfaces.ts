import { SQLBuilderToSQLInputOptions } from 'coral-sql'
import type { TransactionManager } from './transaction-manager'

export type WhereType = Record<string, unknown>

export { TransactionManager } from './transaction-manager'

export interface DataBaseLogger {
  debug(format: string, ...args: unknown[]): void
  info(format: string, ...args: unknown[]): void
  warning(format: string, ...args: unknown[]): void
  error(format: string, ...args: unknown[]): void
  critical(format: string, ...args: unknown[]): void
}

export interface DataBaseContext {
  logger: DataBaseLogger
}
export interface DataBaseCommandOptions {}
export type DataBaseCommandOptionsPartial = Partial<DataBaseCommandOptions>

export type DataBaseMiddlewarePreparePayload = {
  sql: string
  replacements: unknown[]
}
export type DataBaseMiddlewarePrepareResult =
  | DataBaseMiddlewarePreparePayload
  | Promise<DataBaseMiddlewarePreparePayload>
export interface DataBaseMiddleware {
  preprocess(
    payload: DataBaseMiddlewarePreparePayload,
    options: DataBaseCommandOptionsPartial,
    context: DataBaseContext,
  ): DataBaseMiddlewarePrepareResult
}

export interface DataBaseOptions extends SQLBuilderToSQLInputOptions {
  transactionManager?: TransactionManager
}

export interface TransactionOptions {
  /** 親コンテキストID（ネスト時に指定） */
  parentContextId?: string
  /** メタデータ（ログやデバッグ用） */
  metadata?: Record<string, any>
  /** 実行時間の警告閾値（ミリ秒） */
  warningThreshold?: number
}

export interface DataBasePort {
  find<Row>(
    table: string,
    where: WhereType,
    options?: DataBaseCommandOptionsPartial,
  ): Promise<Row | null>
  create(
    table: string,
    data: Record<string, unknown>,
    options?: DataBaseCommandOptionsPartial,
  ): Promise<void>
  update(
    table: string,
    where: WhereType,
    data: Record<string, unknown>,
    options?: DataBaseCommandOptionsPartial,
  ): Promise<void>
  delete(
    table: string,
    where: WhereType,
    options?: DataBaseCommandOptionsPartial,
  ): Promise<void>
  findOrCreate<Row>(
    table: string,
    where: WhereType,
    data: Record<string, unknown>,
    options?: DataBaseCommandOptionsPartial,
  ): Promise<Row>
  updateOrCreate(
    table: string,
    where: WhereType,
    update: Record<string, unknown>,
    create: Record<string, unknown>,
    options?: DataBaseCommandOptionsPartial,
  ): Promise<void>
  txn<T>(fn: (db: DataBasePort) => Promise<T>, options?: TransactionOptions): Promise<T>
  use(middleware: DataBaseMiddleware): this
  sync<Row extends Record<string, unknown>>(
    table: string,
    where: WhereType,
    records: Array<Record<string, unknown>>,
    options?: SyncOptions,
  ): Promise<SyncResult<Row>>
}

export type TransactionCallback = (conn: DataBaseConnectorPort) => Promise<void>

export interface SyncOptions extends DataBaseCommandOptionsPartial {
  key?: string | string[]
  pk?: {
    column: string
    generator?: () => string | number
  }
  noDeleteUnmatched?: boolean
}

export interface SyncResult<Row> {
  created: Row[]
  unchanged: Row[]
  deleted: Row[]
}

export interface DataBaseConnectorPort {
  execute(sql: string, replacements: unknown[]): Promise<void>
  query<T>(sql: string, replacements: unknown[]): Promise<T[]>
  transaction(exec: TransactionCallback): Promise<void>
}
