export type QueryResultData = any
export interface QueryResultList<D> {
  items: D[]
}

type QueryFilterOperator =
  | 'contains'
  | 'not_contains'
  | 'eq' // =
  | 'ne' // !=
  | 'lte' // >=
  | 'lt' // >
  | 'gte' // <=
  | 'gt' // <
  | 'in'
export type QueryFilter<Data extends QueryResultData> = Partial<
  Record<
    keyof Data,
    Partial<Record<Exclude<QueryFilterOperator, 'in'>, any> & { in: any[] }>
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
  filter?: QueryFilter<Data>
  orderBy?: QueryCriteriaOrderBy<Data>
  take?: QueryCriteriaTake
  skip?: QueryCriteriaSkip
}

export interface QueryCriteriaInterface<Data extends QueryResultData = any> {
  readonly filter: QueryFilter<Data>
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

export interface QueryRunnerMiddleware<
  Data,
  List extends QueryResultList<Data> = QueryResultList<Data>,
  Params extends QueryRunnerCriteria<Data> = QueryRunnerCriteria<Data>,
> {
  preprocess?: (criteria: Partial<Params>) => void
  postprocess?: (result: List, criteria: Partial<Params>) => void
}

export interface QuerySpecification<
  Data extends QueryResultData,
  Driver extends QueryDriverInterface,
  List extends QueryResultList<Data> = QueryResultList<Data>,
  Params extends QueryRunnerCriteria<Data> = QueryRunnerCriteria<Data>,
> {
  source: QuerySourceInterface<Data, Driver>
  rules: Partial<Record<keyof Data, string>>
  middlewares?: QueryRunnerMiddleware<Data, List, Params>[]
}

export interface QueryLoggerInterface {
  verbose(message: string, payload?: any): void
  info(message: string, payload?: any): void
  error(message: string, error: Error): void
}
