export type WhereType = Record<string, unknown>

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
  txn<T>(fn: (db: DataBasePort) => Promise<T>): Promise<T>
  use(middleware: DataBaseMiddleware): this
}

export type TransactionCallback = (conn: DataBaseConnectorPort) => Promise<void>

export interface DataBaseConnectorPort {
  execute(sql: string, replacements: unknown[]): Promise<void>
  query<T>(sql: string, replacements: unknown[]): Promise<T[]>
  transaction(exec: TransactionCallback): Promise<void>
}
