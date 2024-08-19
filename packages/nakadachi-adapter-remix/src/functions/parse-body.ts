import { parse } from 'qs'

const PARSE_ARRAY_LIMIT = 1000

export async function parseBody(request: Request) {
  const contentType = request.headers.get('Content-Type') || ''

  if (contentType.startsWith('application/x-www-form-urlencoded')) {
    const formData = await request.formData()
    const data = new URLSearchParams()
    const keys = formData.keys()
    const values = formData.values()
    while (true) {
      const key = keys.next()
      const value = values.next()
      if (key.done) break
      data.append(key.value, value.value)
    }
    return parse(data.toString(), {
      allowDots: true,
      arrayLimit: PARSE_ARRAY_LIMIT,
    })
  }

  if (contentType.startsWith('multipart/form-data')) {
    const formData = await request.formData()
    const data: Record<string, unknown> = {}
    formData.forEach((value, key) => {
      if (Array.isArray(data[key])) {
        ;(data[key] as unknown[]).push(value)
      } else if (key in data) {
        data[key] = [data[key], value]
      } else {
        data[key] = value
      }
    })
    return data
  }

  if (contentType.startsWith('application/json')) {
    return await request.json()
  }

  throw new Error(`Unsupported Content-Type "${contentType}"`)
}
