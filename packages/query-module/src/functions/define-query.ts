import {
  QueryDriverInterface,
  QueryResultData,
  QueryResultList,
  QueryRunnerContext,
  QueryRunnerCriteria,
  QueryRunnerInterface,
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
): QueryRunnerInterface<Data, List, Params> {
  const ctx: QueryRunnerContext = {
    ...context,
    logger: context.logger ? context.logger : createLogger(),
  }

  return options?.builder
    ? options.builder(driver, spec, ctx)
    : new QueryRunner<Data, Driver, List, Params>(driver, spec, ctx)
}
