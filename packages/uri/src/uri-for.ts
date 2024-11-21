import qs from 'qs'

export function uriFor(
  pathTemplate: string,
  params: Record<string, string> = {},
) {
  const data = { ...params }
  const path = pathTemplate
    .replace(/\{(.+?)\}/g, (_match, prop) => {
      const value = data[prop]
      delete data[prop]
      return value ?? ''
    })
    .replace(/\/$/, '')
  const search = ((data) => {
    if (!Object.keys(data).length) {
      return ''
    }
    return `?${qs.stringify(data)}`
  })(data)
  return `${path}${search}`
}
