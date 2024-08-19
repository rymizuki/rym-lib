import { QueryCriteria } from './criteria'
import {
  QueryDriverInterface,
  QueryResultData,
  QueryResultList,
  QueryRunnerContext,
  QueryRunnerCriteria,
  QueryRunnerInterface,
  QuerySpecification,
} from './interfaces'

export class QueryRunner<
  Data extends QueryResultData,
  Driver extends QueryDriverInterface,
  List extends QueryResultList<Data> = QueryResultList<Data>,
  Params extends QueryRunnerCriteria<Data> = QueryRunnerCriteria<Data>,
> implements QueryRunnerInterface<Data, List>
{
  constructor(
    private driver: Driver,
    private spec: QuerySpecification<Data, Driver, List, Params>,
    private context: QueryRunnerContext,
  ) {}

  async one(params: Partial<Params> = {}): Promise<Data | null> {
    params.take = 1

    const list = await this.many(params)

    if (!list.items.length) {
      return null
    }

    return list.items[0] ?? null
  }

  async many(params: Partial<Params> = {}): Promise<List> {
    for (const { preprocess } of this.spec.middlewares ?? []) {
      if (!preprocess) continue
      preprocess(params)
    }
    const criteria = new QueryCriteria<Data>(this.spec.rules, params)

    const items = await this.driver.source(this.spec.source).execute(criteria)
    const result = {
      items: items as Data[],
    } as any

    for (const { postprocess } of this.spec.middlewares ?? []) {
      if (!postprocess) continue
      postprocess(result, params)
    }

    return result
  }
}
