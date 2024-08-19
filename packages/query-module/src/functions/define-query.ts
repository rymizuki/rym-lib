import {
  QueryResultData,
  QueryDriverInterface,
  QuerySpecification,
  QueryRunnerContext,
  QueryLoggerInterface,
  QueryRunnerInterface,
  QueryResultList,
  QueryRunnerCriteria,
} from '../interfaces'
import { QueryRunner } from '../runner'

export function defineQuery<
  Data extends QueryResultData,
  Driver extends QueryDriverInterface,
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
    ) => QueryRunnerInterface<Data>
  },
) {
  const logger: QueryLoggerInterface = {
    verbose(message, payload) {
      console.debug(message, payload)
    },
    info(message, payload) {
      console.info(message, payload)
    },
    error(message, error) {
      console.error(message, error)
    },
  }

  const ctx: QueryRunnerContext = {
    logger,
    ...context,
  }

  return options?.builder
    ? options.builder(driver, spec, ctx)
    : new QueryRunner<Data, Driver, List, Params>(driver, spec, ctx)
}
