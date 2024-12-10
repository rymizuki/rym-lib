import { QueryResultList, QueryRunnerCriteria } from '@rym-lib/query-module'

export interface QueryResultListWithPage<Data> extends QueryResultList<Data> {
  pagination: {
    current: number
    rows: number
    hasNext: boolean
  }
}
export interface QueryRunnerCriteriaWithPage<Data>
  extends QueryRunnerCriteria<Data> {
  page?: number
  rows?: number
  noPagination?: boolean
}
