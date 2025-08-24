export type QueryResultData = any
export interface QueryResultList<D> {
  items: D[]
}

type QueryFilterOperator =
  | 'contains'
  | 'not_contains'
  | 'eq' // = (automatically handles raw SQL expressions)
  | 'ne' // != (automatically handles raw SQL expressions)
  | 'lte' // >=
  | 'lt' // >
  | 'gte' // <=
  | 'gt' // <
  | 'in' // IN (automatically handles raw SQL expressions)
export type QueryFilter<Data extends QueryResultData> = Partial<
  Record<
    keyof Data | (string & {}),
    Partial<
      Record<Exclude<QueryFilterOperator, 'in'>, any> & {
        in: any[]
      }
    >
  >
>
type QueryCriteriaOrderByRecord<
  Data,
  Keys extends Extract<keyof Data, string> = Extract<keyof Data, string>,
> = `${Keys}` | `${Keys}:${'asc' | 'desc'}`
export type QueryCriteriaOrderBy<Data> =
  | QueryCriteriaOrderByRecord<Data>
  | QueryCriteriaOrderByRecord<Data>[]
  | undefined
export type QueryCriteriaTake = number | undefined
export type QueryCriteriaSkip = number | undefined
export interface QueryRunnerCriteria<Data extends QueryResultData> {
  filter?: QueryFilter<Data> | QueryFilter<Data>[]
  orderBy?: QueryCriteriaOrderBy<Data>
  take?: QueryCriteriaTake
  skip?: QueryCriteriaSkip
}

export interface QueryCriteriaInterface<Data extends QueryResultData = any> {
  readonly filter: QueryFilter<Data> | QueryFilter<Data>[]
  readonly orderBy: QueryCriteriaOrderBy<Data>
  readonly take: QueryCriteriaTake
  readonly skip: QueryCriteriaSkip
}

export interface QueryRunnerInterface<
  Data extends QueryResultData,
  List extends QueryResultList<Data> = QueryResultList<Data>,
  Params extends QueryRunnerCriteria<Data> = QueryRunnerCriteria<Data>,
> {
  one(params?: Params): Promise<Data | null>
  many(params?: Params): Promise<List>
  find(params: Params): Promise<Data>
}

export interface QueryRunnerContext {
  logger: QueryLoggerInterface
}

export interface QueryDriverInterface {
  source(fn: (...args: any[]) => any): this
  execute<D>(
    criteria: QueryCriteriaInterface<D>,
  ): Promise<Record<string, any>[]>
}

interface QuerySourceInterface<
  Data extends QueryResultData,
  Driver extends QueryDriverInterface,
  SourceFn extends Parameters<Driver['source']>[0] = Parameters<
    Driver['source']
  >[0],
> {
  (...args: Parameters<SourceFn>): ReturnType<SourceFn>
}

export interface QueryRunnerMiddlewareContext<
  Data,
  List extends QueryResultList<Data> = QueryResultList<Data>,
  Params extends QueryRunnerCriteria<Data> = QueryRunnerCriteria<Data>,
> extends QueryRunnerContext {
  pid: string
  runner: QueryRunnerInterface<Data, List, Params>
}
export interface QueryRunnerMiddleware<
  Data,
  List extends QueryResultList<Data> = QueryResultList<Data>,
  Params extends QueryRunnerCriteria<Data> = QueryRunnerCriteria<Data>,
> {
  preprocess?: (
    criteria: Partial<Params>,
    context: QueryRunnerMiddlewareContext<Data, List, Params>,
  ) => void | Promise<void>
  postprocess?: (
    result: List,
    criteria: Partial<Params>,
    context: QueryRunnerMiddlewareContext<Data, List, Params>,
  ) => void | Promise<void>
}

export interface QuerySpecification<
  Data extends QueryResultData,
  Driver extends QueryDriverInterface,
  List extends QueryResultList<Data> = QueryResultList<Data>,
  Params extends QueryRunnerCriteria<Data> = QueryRunnerCriteria<Data>,
> {
  name?: string
  source: QuerySourceInterface<Data, Driver>
  rules: Partial<Record<keyof NonNullable<Params['filter']> | string, string>>
  criteria?: (params: Partial<Params>) => Partial<Params>
  middlewares?: QueryRunnerMiddleware<Data, List, Params>[]
}

export interface QueryLoggerInterface {
  verbose(message: string, payload?: any): void
  info(message: string, payload?: any): void
  error(message: string, error: Error): void
}
