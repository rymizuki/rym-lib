import qs from 'qs'
import { useMemo } from 'react'

import { useSearchParams } from '@remix-run/react'

export function useQueryParams<T = Record<string, unknown>>() {
  const [urlSearchParams, updateUrlSearchParams] = useSearchParams()
  const params = useMemo(() => {
    return qs.parse(urlSearchParams.toString()) as T
  }, [urlSearchParams])

  const update = (input: Record<string, unknown>) => {
    const queryString = qs.stringify(input)
    const queries = queryString.split(/&/)
    updateUrlSearchParams((prev) => {
      for (let index = 0; index < queries.length; index++) {
        const query = queries[index]
        if (!query) continue
        const [key, value] = query.split('=')
        if (!key) continue
        prev.set(decodeURIComponent(key), value ?? '')
      }
      return prev
    })
  }

  const serialize = (params: Record<string, unknown>) => {
    const query_string = qs.stringify(params)
    const result = query_string.split(/&/).reduce(
      (prev, query) => {
        const [prop, value] = query.split(/=/)
        if (!prop) return prev
        prev[decodeURIComponent(prop)] = decodeURIComponent(value ?? '')
        return prev
      },
      {} as Record<string, unknown>,
    )
    return result
  }

  return {
    params,
    update,
    serialize,
  }
}
