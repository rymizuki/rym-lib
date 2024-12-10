import { QueryRunnerMiddleware } from '@rym-lib/query-module'

import {
  QueryResultListWithPage,
  QueryRunnerCriteriaWithPage,
} from './interfaces'

export function pagination<
  Data,
  List extends QueryResultListWithPage<Data>,
  Params extends QueryRunnerCriteriaWithPage<Data>,
>({ defaultRows }: Partial<{ defaultRows: number }> = {}) {
  const middleware: QueryRunnerMiddleware<Data, List, Params> = {
    preprocess(criteria) {
      if (criteria.take === 1) return
      if (criteria.noPagination) return
      if (!criteria.page) criteria.page = 1
      if (!criteria.rows) criteria.rows = defaultRows || 20

      const page = criteria.page as number
      const rows = criteria.rows as number
      criteria.take = rows + 1
      criteria.skip = (page - 1) * rows
    },
    postprocess(result, criteria) {
      if (!criteria.take || criteria.take === 1 || !criteria.noPagination)
        return

      const hasNext = result.items.length === criteria.take
      const items = result.items

      if (hasNext) {
        items.pop()
      }

      result.items = items
      result.pagination = {
        current: criteria.page as number,
        rows: criteria.rows as number,
        hasNext,
      }
    },
  }
  return middleware
}
