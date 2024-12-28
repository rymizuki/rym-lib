import type { QueryRunnerMiddleware } from '../'

import { toArray } from '@rym-lib/utilities/array'

type Column<T> = keyof T | (keyof T)[]
type IterateeFunction<
  Data,
  Col extends keyof Data = keyof Data,
  Val extends Data[Col] = Data[Col],
> = (value: Val) => Val

export function deflate<D, C extends Column<D> = Column<D>>(
  columns: C,
  iteratee: IterateeFunction<D>,
) {
  const targets = toArray(columns)
  const middleware: QueryRunnerMiddleware<D> = {
    preprocess(criteria) {
      if (criteria.filter) {
        for (const filter of Array.isArray(criteria.filter)
          ? criteria.filter
          : [criteria.filter]) {
          for (const column in filter) {
            if (!Object.prototype.hasOwnProperty.call(filter, column)) continue
            const element = filter[column]
            for (const operator in element) {
              if (!Object.prototype.hasOwnProperty.call(element, operator))
                continue
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const value = (element as any)[operator]

              if (targets.includes(column)) {
                if (operator === 'in' && Array.isArray(value)) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  ;(filter as any)[column][operator] = value.map((v) =>
                    iteratee(v),
                  )
                } else {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  ;(filter as any)[column][operator] = iteratee(value)
                }
              }
            }
          }
        }
      }
    },
  }
  return middleware
}
