import crypto from 'crypto'

import { QueryCriteria } from './criteria'
import { QueryRunnerResourceNotFoundException } from './exceptions'
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
    const pid = crypto.randomUUID()
    for (const { preprocess } of this.spec.middlewares ?? []) {
      if (!preprocess) continue
      await preprocess(params, { ...this.context, pid, runner: this })
    }
    const criteria = new QueryCriteria<Data>(
      this.spec.rules,
      this.spec.criteria ? this.spec.criteria(params) : params,
    )

    const items = await this.driver.source(this.spec.source).execute(criteria)
    const result = {
      items: items as Data[],
    } as any

    for (const { postprocess } of (this.spec.middlewares ?? []).reverse()) {
      if (!postprocess) continue
      await postprocess(result, params, { ...this.context, pid, runner: this })
    }

    return result
  }

  async find(params: Params): Promise<Data> {
    const record = await this.one(params)

    if (!record) {
      throw new QueryRunnerResourceNotFoundException(
        this.spec.name ?? '',
        params,
      )
    }

    return record
  }
}
