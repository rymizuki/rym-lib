import { UIMatch } from 'react-router'

export type RouteHandle<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Data = any,
> = {
  breadcrumbs?: (
    match: UIMatch<Data>,
  ) => { label: string; to?: string; href?: string }[]
}
