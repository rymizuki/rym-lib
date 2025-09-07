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

  constructor(
    private mapping: QuerySpecification<Data, any>['rules'],
    private input: Partial<{
      filter: QueryFilter<Data> | QueryFilter<Data>[]
      orderBy: QueryCriteriaOrderBy<Data>
      take: QueryCriteriaTake
      skip: QueryCriteriaSkip
    }>,
  ) {
    this.attr = this.remap({
      filter: input.filter ?? {},
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
        const wasArray = Array.isArray(filter)
        const filters = Array.isArray(filter) ? filter : [filter]
        const results = []
        for (const f of filters) {
          if (!f || !Object.keys(f).length) continue
          const ret: Record<string, unknown> = {}
          for (const prev in f) {
            if (!Object.prototype.hasOwnProperty.call(f, prev)) continue
            const value = f[prev]
            // Safe property access with type guard to handle runtime dynamic lookups
            const mappingValue = Object.prototype.hasOwnProperty.call(
              this.mapping,
              prev,
            )
              ? this.mapping[prev as keyof typeof this.mapping]
              : undefined

            // Skip undefined and null values
            if (value === undefined || value === null) continue

            // Static string mapping (rename)
            const column = (() => {
              if (typeof mappingValue === 'string') return mappingValue
              if (mappingValue?.column) return mappingValue.column
              return null
            })()
            const filter =
              typeof mappingValue === 'object' && mappingValue !== null
                ? mappingValue.filter
                : undefined
            const rename = typeof column === 'string' ? column : prev

            ret[rename] = {
              column,
              value,
              filter,
            }
          }
          // Only push non-empty filter objects
          if (Object.keys(ret).length > 0) {
            results.push(ret)
          }
        }
        // Return in the same format as input: preserve original structure
        // For empty filter, always return {} (single object)
        if (results.length === 0) {
          return {} as QueryCriteriaFilter<Data>
        }
        return wasArray
          ? (results as QueryCriteriaFilter<Data>[])
          : results[0] ?? ({} as QueryCriteriaFilter<Data>)
      })(input.filter),
      orderBy: ((orderBy) => {
        if (!orderBy) return orderBy

        const orders = Array.isArray(orderBy) ? orderBy : [orderBy]
        const mappedOrders = []

        for (const order of orders) {
          if (typeof order !== 'string') {
            mappedOrders.push(order)
            continue
          }

          const [columnName, direction] = order.split(':')
          if (!columnName) continue

          // Safe property access with type guard to handle runtime dynamic lookups
          const mappingValue = Object.prototype.hasOwnProperty.call(
            this.mapping,
            columnName,
          )
            ? this.mapping[columnName as keyof typeof this.mapping]
            : undefined

          // Get mapped column name
          const mappedColumn = (() => {
            if (typeof mappingValue === 'string') return mappingValue
            if (mappingValue?.column && typeof mappingValue.column === 'string')
              return mappingValue.column
            return columnName // Use original if no mapping
          })()

          const mappedOrder = direction
            ? `${mappedColumn}:${direction}`
            : mappedColumn
          mappedOrders.push(mappedOrder)
        }

        return Array.isArray(orderBy) ? mappedOrders : mappedOrders[0]
      })(input.orderBy),
      take: input.take,
      skip: input.skip,
    }

    return attr as P
  }
}
