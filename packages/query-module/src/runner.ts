import crypto from 'crypto'

import { QueryCriteria } from './criteria'
import { QueryRunnerResourceNotFoundException } from './exceptions'
import {
  QueryDriverInterface,
  QueryFilter,
  QueryFilterOperator,
  QueryResultData,
  QueryResultList,
  QueryRunnerContext,
  QueryRunnerCriteria,
  QueryRunnerWithCount,
  QuerySpecification,
} from './interfaces'

export class QueryRunner<
  Data extends QueryResultData,
  Driver extends QueryDriverInterface,
  List extends QueryResultList<Data> = QueryResultList<Data>,
  Params extends QueryRunnerCriteria<Data> = QueryRunnerCriteria<Data>,
> implements QueryRunnerWithCount<Data, List, Params>
{
  constructor(
    private driver: Driver,
    private spec: QuerySpecification<Data, Driver, List, Params>,
    private context: QueryRunnerContext,
  ) {
    if (!driver) {
      throw new TypeError('QueryRunner requires a driver')
    }
    for (const method of ['source', 'execute', 'executeCount'] as const) {
      if (typeof driver[method] !== 'function') {
        throw new TypeError(`QueryDriverInterface.${method} is required`)
      }
    }

    if (!spec || typeof spec.source !== 'function') {
      throw new TypeError(
        'QueryRunner requires a valid QuerySpecification with a source function',
      )
    }

    if (!context || !context.logger) {
      throw new TypeError('QueryRunner requires a valid context with logger')
    }
  }

  async one(params: Partial<Params> = {}): Promise<Data | null> {
    // Do not mutate the caller's params object — create a shallow clone
    const cloned: Partial<Params> = { ...(params as any), take: 1 }

    const list = await this.many(cloned)

    if (!list.items.length) {
      return null
    }

    return list.items[0] ?? null
  }

  async many(params: Partial<Params> = {}): Promise<List> {
    const { pid, source, criteria } = await this.prepare(params)

    const items = await source.execute(criteria)
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

  async count(params: Partial<Params> = {}): Promise<number> {
    const { source, criteria } = await this.prepare(params)
    return source.executeCount(criteria)
  }

  private async prepare(params: Partial<Params>) {
    const pid = crypto.randomUUID()
    for (const { preprocess } of this.spec.middlewares ?? []) {
      if (!preprocess) continue
      await preprocess(params, { ...this.context, pid, runner: this })
    }

    const source = this.driver.source(this.spec.source)
    const criteria = new QueryCriteria<Data>(
      this.spec.rules,
      this.spec.criteria ? this.spec.criteria(params) : params,
    )

    return { pid, source, criteria }
  }
}
