import {
  QueryCriteriaInterface,
  QueryDriverInterface,
  QueryResultList,
  QueryRunner,
  QueryRunnerContext,
  QueryRunnerCriteria,
  QueryRunnerMiddleware,
} from '../'

import { createRunnerContext } from './create-context'

class DummyDriver implements QueryDriverInterface {
  source(setup: (...args: any[]) => any): this {
    return this
  }
  customFilter(fn: (source: any) => any): any {
    // For middleware testing, just return empty object
    return fn({})
  }

  async execute<D>(
    criteria: QueryCriteriaInterface<D>,
  ): Promise<Record<string, any>[]> {
    return []
  }
}

export async function runMiddleware<Data>(
  criteria: QueryRunnerCriteria<Data>,
  result: QueryResultList<Data>,
  middleware: QueryRunnerMiddleware<Data>,
  ctx?: QueryRunnerContext,
) {
  const context = ctx ?? createRunnerContext()
  const runner = new QueryRunner<Data, DummyDriver>(
    new DummyDriver(),
    {
      source: (builder) => builder,
      rules: {},
    },
    context,
  )
  const { preprocess, postprocess } = middleware
  const middlewareContext = { ...context, pid: crypto.randomUUID(), runner }
  preprocess?.(criteria, middlewareContext)
  postprocess?.(result, criteria, middlewareContext)
}
