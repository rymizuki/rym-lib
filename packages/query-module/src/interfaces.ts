export type QueryResultData = any
export interface QueryResultList<D> {
  items: D[]
}

export type QueryFilterOperator =
  | 'contains'
  | 'not_contains'
  | 'eq' // = (automatically handles raw SQL expressions)
  | 'ne' // != (automatically handles raw SQL expressions)
  | 'lt' // <
  | 'lte' // <=
  | 'gt' // >
  | 'gte' // >=
  | 'in' // IN (automatically handles raw SQL expressions)
export type QueryFilter<Data extends QueryResultData> = Partial<
  Record<
    keyof Data,
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
export interface QueryRunnerCriteria<
  Data extends QueryResultData,
  DataExtra extends Partial<Record<string, any>> = {},
> {
  filter?: QueryFilter<Data & DataExtra> | QueryFilter<Data & DataExtra>[]
  orderBy?: QueryCriteriaOrderBy<Data>
  take?: QueryCriteriaTake
  skip?: QueryCriteriaSkip
}

export type QueryCriteriaFilter<
  Data extends QueryResultData = any,
  Driver extends QueryDriverInterface = any,
> = Partial<
  Record<
    string,
    {
      column: string | (() => any)
      value: any
      filter: (
        value: Parameters<NonNullable<Driver['customFilter']>>[0],
        context: Parameters<NonNullable<Driver['customFilter']>>[1],
      ) => ReturnType<NonNullable<Driver['customFilter']>>[0]
    }
  >
>

export interface QueryCriteriaInterface<Data extends QueryResultData = any> {
  readonly filter: // FIXME: これではCriteriaがwrapしてる意味がない。複雑性を外に拡散してるだけだ
  | QueryCriteriaFilter<Data>
    | QueryCriteriaFilter<Data>[]
    | QueryFilter<Data>
    | QueryFilter<Data>[]
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

export type CustomFilterFieldFunction<
  Payload = any,
  Context = any,
  Result = any,
> = (payload: Payload, context: Context) => Result
export type QueryDriverCustomFilterFunction<
  Payload = any,
  Context = any,
  Result = any,
> = (
  payload: Payload,
  context: Context,
  fn: CustomFilterFieldFunction<Payload, Context, Result>,
) => Result
export interface QueryDriverInterface {
  source(fn: (...args: any[]) => any): this
  execute<D>(
    criteria: QueryCriteriaInterface<D>,
  ): Promise<Record<string, any>[]>
  customFilter?: QueryDriverCustomFilterFunction
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

type UnpackArray<T> = T extends Array<infer U> ? U : T

type UnpackQueryRunnerCriteriaFilter<
  Data,
  Params extends QueryRunnerCriteria<Data>,
> = UnpackArray<NonNullable<Params['filter']>>
type QueryRule<Driver extends QueryDriverInterface> =
  | string
  | {
      column?: () => any
      filter?: (
        value: Parameters<NonNullable<Driver['customFilter']>>[0],
        context: Parameters<NonNullable<Driver['customFilter']>>[1],
      ) => ReturnType<NonNullable<Driver['customFilter']>>[0]
    }

export interface QuerySpecification<
  Data extends QueryResultData,
  Driver extends QueryDriverInterface,
  List extends QueryResultList<Data> = QueryResultList<Data>,
  Params extends QueryRunnerCriteria<Data> = QueryRunnerCriteria<Data>,
> {
  name?: string
  source: QuerySourceInterface<Data, Driver>
  // Rules must map existing filter keys to source field names. Arbitrary
  // string keys are not allowed to keep the type-safety of filter keys.
  rules: Partial<
    Record<
      keyof UnpackQueryRunnerCriteriaFilter<Data, Params>,
      QueryRule<Driver>
    >
  >
  criteria?: (params: Partial<Params>) => Partial<Params>
  middlewares?: QueryRunnerMiddleware<Data, List, Params>[]
}

export interface QueryLoggerInterface {
  verbose(message: string, payload?: any): void
  info(message: string, payload?: any): void
  error(message: string, error: Error): void
}
