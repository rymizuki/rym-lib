import {
  QueryResultData,
  QueryCriteriaInterface,
  QuerySpecification,
  QueryCriteriaOrderBy,
  QueryCriteriaSkip,
  QueryCriteriaTake,
  QueryFilter,
} from './interfaces'

export class QueryCriteria<Data extends QueryResultData>
  implements QueryCriteriaInterface<Data>
{
  private attr: {
    filter: QueryFilter<Data> | QueryFilter<Data>[]
    orderBy: QueryCriteriaOrderBy<Data>
    take: QueryCriteriaTake
    skip: QueryCriteriaSkip
  }

  constructor(
    private mapping: QuerySpecification<Data, any>['rules'],
    input: Partial<typeof this.attr>,
  ) {
    this.attr = this.remap({
      filter: input.filter ?? {},
      orderBy: input.orderBy,
      take: input.take,
      skip: input.skip,
    })
  }

  get filter() {
    return this.attr.filter ?? {}
  }

  get orderBy() {
    return this.attr.orderBy
  }

  get take() {
    return this.attr.take
  }

  get skip() {
    return this.attr.skip
  }

  private remap<P extends typeof this.attr>(input: P): P {
    const attr = {
      filter: ((filter) => {
        const filters = Array.isArray(filter) ? filter : [filter]
        const results = []
        for (const f of filters) {
          const ret: any = {}
          for (const prev in f) {
            if (!Object.prototype.hasOwnProperty.call(f, prev)) continue
            const value = f[prev]
            const rename = this.mapping[prev]
            ret[rename ? rename : prev] = value
          }
          results.push(ret)
        }
        return results.length === 0
          ? undefined
          : results.length === 1
            ? (results[0] as P['filter'])
            : (results as P['filter'][])
      })(input.filter),
      orderBy: input.orderBy,
      take: input.take,
      skip: input.skip,
    }

    return attr as P
  }
}
