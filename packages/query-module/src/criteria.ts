import {
  QueryCriteriaInterface,
  QueryCriteriaOrderBy,
  QueryCriteriaSkip,
  QueryCriteriaTake,
  QueryDriverInterface,
  QueryFilter,
  QueryFilterOperator,
  QueryResultData,
  QuerySpecification,
} from './interfaces'

export class QueryCriteria<Data extends QueryResultData>
  implements QueryCriteriaInterface<Data>
{
  private attr: {
    filter: QueryFilter<Data>[]
    orderBy: QueryCriteriaOrderBy<Data>
    take: QueryCriteriaTake
    skip: QueryCriteriaSkip
  }

  constructor(
    private mapping: QuerySpecification<Data, any>['rules'],
    private input: Partial<typeof this.attr>,
    private driver: QueryDriverInterface,
  ) {
    this.attr = this.remap({
      filter: input.filter ?? [],
      orderBy: input.orderBy,
      take: input.take,
      skip: input.skip,
    })
  }

  get filter() {
    return this.attr.filter
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
          if (!Object.keys(f).length) continue
          const ret: any = {}
          for (const prev in f) {
            if (!Object.prototype.hasOwnProperty.call(f, prev)) continue
            const value = f[prev]
            // mapping is typed by QuerySpecification.rules which does not
            // include arbitrary string keys. At runtime we may index by
            // property names coming from filters (strings), so cast to any
            // to avoid TypeScript index errors while preserving the
            // runtime lookup behavior.
            const mappingValue = (this.mapping as any)[prev]

            // Skip undefined values
            if (value === undefined) continue

            // Static string mapping (rename)
            const rename = mappingValue as string
            ret[rename ? rename : prev] = value
          }
          results.push(ret)
        }
        // Always return an array; callers now expect QueryFilter<Data>[]
        return results as any
      })(input.filter),
      orderBy: input.orderBy,
      take: input.take,
      skip: input.skip,
    }

    return attr as P
  }
}
