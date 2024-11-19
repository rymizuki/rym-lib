import { UIMatch } from '@remix-run/react'

export type RouteHandle<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Data = any,
> = {
  breadcrumbs?: (
    match: UIMatch<Data>,
  ) => { label: string; to?: string; href?: string }[]
}
