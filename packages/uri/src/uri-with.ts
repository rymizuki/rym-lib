import qs from 'qs'
import { URL } from 'url'

export function uriWith(
  uri: string,
  data: Record<string, unknown> = {},
): string {
  const { protocol, hostname, pathname, port, queries, hash } = parse(uri)
  const query = qs.stringify({ ...queries, ...data })
  return `${protocol ? protocol + '//' : ''}${
    (hostname ? hostname : '') + (port ? `:${port}` : '')
  }${pathname}${query ? '?' + query : ''}${hash ? '#' + hash : ''}`
}

function parse(uri: string) {
  const { protocol, hostname, pathname, port, search, hash } = /^\//.test(uri)
    ? ((uri) => {
        const [pathname, search, hash] = uri.split(/\?|#/)
        return {
          protocol: undefined,
          hostname: undefined,
          port: undefined,
          pathname,
          search,
          hash,
        }
      })(uri)
    : new URL(uri)
  const queries = search ? qs.parse(search) : {}
  return {
    protocol,
    hostname,
    pathname,
    port,
    search,
    hash,
    queries,
  }
}
