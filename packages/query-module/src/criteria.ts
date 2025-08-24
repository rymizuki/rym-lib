import {
  QueryResultData,
  QueryCriteriaInterface,
  QuerySpecification,
  QueryCriteriaOrderBy,
  QueryCriteriaSkip,
  QueryCriteriaTake,
  QueryFilter,
  QueryRunnerCriteria,
  QueryDriverInterface,
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
    private mapping: Partial<
      Record<
        keyof NonNullable<QueryRunnerCriteria<Data>['filter']> | string,
        string | ((value: any, sourceInstance: any) => string)
      >
    >,
    input: Partial<typeof this.attr>,
    private customFilter: QueryDriverInterface['customFilter'],
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
          if (!Object.keys(f).length) continue
          const ret: any = {}
          for (const prev in f) {
            if (!Object.prototype.hasOwnProperty.call(f, prev)) continue
            const value = f[prev]
            const mappingValue = this.mapping[prev]

            // Skip undefined values
            if (value === undefined) continue

            // If mapping value is a function, execute it with value and sourceInstance
            if (typeof mappingValue === 'function') {
              const result = this.customFilter((source) =>
                mappingValue(value, source),
              )
              // If the result is a string, use it as the renamed key
              if (typeof result === 'string') {
                ret[result] = value
              } else {
                // For SQL expressions, use the expression as the value for the original key
                // This allows the SQL builder to handle the expression directly
                ret[prev] = result
              }
            } else {
              // Static string mapping (rename)
              const rename = mappingValue
              ret[rename ? rename : prev] = value
            }
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
