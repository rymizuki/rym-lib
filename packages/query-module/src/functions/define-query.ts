import {
  QueryDriverInterface,
  QueryDriverWithCountInterface,
  QueryResultData,
  QueryResultList,
  QueryRunnerBase,
  QueryRunnerContext,
  QueryRunnerCriteria,
  QueryRunnerInterface,
  QueryRunnerWithCount,
  QuerySpecification,
} from '../interfaces'
import { createLogger } from '../logger'
import { QueryRunner } from '../runner'

export function defineQuery<
  Data extends QueryResultData,
  Driver extends QueryDriverInterface = QueryDriverInterface,
  List extends QueryResultList<Data> = QueryResultList<Data>,
  Params extends QueryRunnerCriteria<Data> = QueryRunnerCriteria<Data>,
>(
  driver: Driver,
  spec: QuerySpecification<Data, Driver, List, Params>,
  context: Partial<QueryRunnerContext> = {},
  options?: {
    builder: (
      driver: Driver,
      spec: QuerySpecification<Data, Driver, List, Params>,
      context: QueryRunnerContext,
    ) => QueryRunnerInterface<Data, List, Params>
  },
): QueryRunnerBase<Data, List, Params> {
  const ctx: QueryRunnerContext = {
    ...context,
    logger: context.logger ? context.logger : createLogger(),
  }

  return options?.builder
    ? options.builder(driver, spec, ctx)
    : new QueryRunner<Data, Driver, List, Params>(driver, spec, ctx)
}

/**
 * Variant of {@link defineQuery} that exposes `count()` on the runner.
 *
 * Use this when the query spec opts into count support. The driver is
 * constrained to {@link QueryDriverWithCountInterface}, so a driver that
 * doesn't implement `executeCount` is rejected at compile time.
 */
export function defineQueryWithCount<
  Data extends QueryResultData,
  Driver extends QueryDriverWithCountInterface = QueryDriverWithCountInterface,
  List extends QueryResultList<Data> = QueryResultList<Data>,
  Params extends QueryRunnerCriteria<Data> = QueryRunnerCriteria<Data>,
>(
  driver: Driver,
  spec: QuerySpecification<Data, Driver, List, Params>,
  context: Partial<QueryRunnerContext> = {},
  options?: {
    builder: (
      driver: Driver,
      spec: QuerySpecification<Data, Driver, List, Params>,
      context: QueryRunnerContext,
    ) => QueryRunnerInterface<Data, List, Params>
  },
): QueryRunnerWithCount<Data, List, Params> {
  const ctx: QueryRunnerContext = {
    ...context,
    logger: context.logger ? context.logger : createLogger(),
  }

  const runner = options?.builder
    ? options.builder(driver, { ...spec, count: true }, ctx)
    : new QueryRunner<Data, Driver, List, Params>(
        driver,
        { ...spec, count: true },
        ctx,
      )

  return runner as QueryRunnerWithCount<Data, List, Params>
}
