import { useMatches } from '@remix-run/react'
import { toArray } from '@rym-lib/utilities/array'

import { RouteHandle } from './types'

export function useBreadcrumbs() {
  const matches = useMatches()

  let items: { label: string; to?: string }[] = []
  for (const match of matches) {
    if (!isHandleFunction(match.handle)) continue
    if (!match.handle.breadcrumbs) continue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = toArray(match.handle.breadcrumbs(match as any))
    items = items.concat(rows)
  }
  return items
}

function isHandleFunction(handle: unknown): handle is RouteHandle {
  if (!handle) {
    return false
  }
  if (typeof handle !== 'object') {
    return false
  }
  if (!('breadcrumbs' in handle)) {
    return false
  }
  return true
}
