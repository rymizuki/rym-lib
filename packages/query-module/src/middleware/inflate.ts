import type { QueryRunnerMiddleware } from '../'

import { toArray } from '@rym-lib/utilities/array'

type Column<T> = keyof T | (keyof T)[]
type IterateeFunction<
  Data,
  Col extends keyof Data = keyof Data,
  Val extends Data[Col] = Data[Col],
> = (value: Val) => Val

export function inflate<D, C extends Column<D> = Column<D>>(
  columns: C,
  iteratee: IterateeFunction<D>,
) {
  const targets = toArray(columns)
  const middleware: QueryRunnerMiddleware<D> = {
    postprocess(result) {
      result.items = result.items.map((record) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (Object.keys(record as any) as (keyof D)[]).reduce(
          (prev, column) => {
            if (targets.includes(column)) {
              return {
                ...prev,
                [column]: iteratee(prev[column]),
              }
            }
            return prev
          },
          record,
        )
      })
    },
  }
  return middleware
}
