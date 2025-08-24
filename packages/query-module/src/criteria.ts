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
    filter: QueryFilter<Data> | QueryFilter<Data>[]
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

            // If mapping value is a function, execute it and use result as SQL expression
            if (typeof mappingValue === 'function') {
              const operators = Object.keys(value) as QueryFilterOperator[]
              for (const operator of operators) {
                const operatorValue = (value as any)[operator]
                const result = this.driver.customFilter(
                  operator,
                  operatorValue,
                  mappingValue as any,
                )
                // Initialize the object if it doesn't exist
                if (!ret[prev]) {
                  ret[prev] = {}
                }
                ret[prev][operator] = result
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
