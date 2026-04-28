import {
  QueryDriverInterface,
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
  const Spec extends QuerySpecification<
    Data,
    Driver,
    List,
    Params
  > = QuerySpecification<Data, Driver, List, Params>,
>(
  driver: Driver,
  spec: Spec,
  context: Partial<QueryRunnerContext> = {},
  options?: {
    builder: (
      driver: Driver,
      spec: QuerySpecification<Data, Driver, List, Params>,
      context: QueryRunnerContext,
    ) => QueryRunnerInterface<Data, List, Params>
  },
): Spec['count'] extends true
  ? QueryRunnerWithCount<Data, List, Params>
  : QueryRunnerBase<Data, List, Params> {
  const ctx: QueryRunnerContext = {
    ...context,
    logger: context.logger ? context.logger : createLogger(),
  }

  const runner = options?.builder
    ? options.builder(driver, spec, ctx)
    : new QueryRunner<Data, Driver, List, Params>(driver, spec, ctx)

  return runner as Spec['count'] extends true
    ? QueryRunnerWithCount<Data, List, Params>
    : QueryRunnerBase<Data, List, Params>
}
