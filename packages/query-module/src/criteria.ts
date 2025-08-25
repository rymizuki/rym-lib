import {
  QueryCriteriaFilter,
  QueryCriteriaInterface,
  QueryCriteriaOrderBy,
  QueryCriteriaSkip,
  QueryCriteriaTake,
  QueryFilter,
  QueryResultData,
  QuerySpecification,
} from './interfaces'

export class QueryCriteria<Data extends QueryResultData>
  implements QueryCriteriaInterface<Data>
{
  private attr: {
    filter: QueryCriteriaFilter<Data> | QueryCriteriaFilter<Data>[]
    orderBy: QueryCriteriaOrderBy<Data>
    take: QueryCriteriaTake
    skip: QueryCriteriaSkip
  }
  private legacyFilter: QueryFilter<Data> | QueryFilter<Data>[]

  constructor(
    private mapping: QuerySpecification<Data, any>['rules'],
    private input: Partial<{
      filter: QueryFilter<Data> | QueryFilter<Data>[]
      orderBy: QueryCriteriaOrderBy<Data>
      take: QueryCriteriaTake
      skip: QueryCriteriaSkip
    }>,
  ) {
    this.legacyFilter = input.filter ?? {}
    this.attr = this.remap({
      filter: input.filter ?? {},
      orderBy: input.orderBy,
      take: input.take,
      skip: input.skip,
    })
  }

  get filter() {
    // For backward compatibility with tests, return legacy format when no mapping is applied
    if (this.shouldUseLegacyFormat()) {
      return this.legacyFilter
    }
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

  private shouldUseLegacyFormat(): boolean {
    // Always use new format - we'll ensure backward compatibility in driver layer
    return false
  }

  private remap<P extends typeof this.attr>(input: P): P {
    const attr = {
      filter: ((filter) => {
        const wasArray = Array.isArray(filter)
        const filters = Array.isArray(filter) ? filter : [filter]
        const results = []
        for (const f of filters) {
          if (!f || !Object.keys(f).length) continue
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
            const column = (() => {
              if (typeof mappingValue === 'string') return mappingValue
              if (mappingValue?.column) return mappingValue.column
              return null
            })()
            const rename = typeof column === 'string' ? column : prev
            ret[rename] = { column, value }
          }
          results.push(ret)
        }
        // Return in the same format as input: preserve original structure
        // For empty filter, always return {} (single object)
        if (results.length === 0) {
          return {} as any
        }
        return wasArray ? results : ((results[0] ?? {}) as any)
      })(input.filter),
      orderBy: input.orderBy,
      take: input.take,
      skip: input.skip,
    }

    return attr as P
  }
}
