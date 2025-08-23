import { parse } from 'qs'
import { redirect } from 'react-router'

import {
  Input,
  type InputPort,
  type NakadachiAdapterInterface,
  type NakadachiContext,
  type NakadachiResponse,
  type NakadachiResult,
} from '@rym-lib/nakadachi'

type ErrorHandleFunction = (
  error: unknown,
  input: InputPort,
  context: NakadachiContext,
) => any

export const createAdapter = <Data>(
  args: any,
  { handleError }: { handleError: ErrorHandleFunction },
) => {
  const adapter: NakadachiAdapterInterface<Data> = {
    createInput: async () => {
      const { request, params } = args
      const { method, headers } = request
      const url = new URL(request.url)
      const queries = parse(url.search, {
        allowDots: true,
        ignoreQueryPrefix: true,
        arrayLimit: 1000,
      }) as any
      const body = await (async () => {
        if (/^HEAD|GET$/.test(method)) return null
        if (/^DELETE$/.test(method) && !headers.get('Content-Type')) {
          return null
        }

        return await parseBody(request)
      })()
      return new Input({
        params,
        headers,
        method,
        url,
        queries,
        body,
      })
    },
    createContext: (context: Partial<NakadachiContext>) => {
      const { context: ctx } = args as any
      for (const prop in ctx) {
        if (!Object.prototype.hasOwnProperty.call(ctx, prop)) {
          continue
        }

        ;(context as any)[prop] = ctx[prop]
      }
      return context as NakadachiContext
    },
    createResponse: async (
      result: NakadachiResult,
      input: InputPort<any>,
      context: NakadachiContext,
      response: NakadachiResponse,
    ) => {
      if ('redirect' in result) {
        if (result.status) {
          response.status = result.status
        }
        return redirect(result.redirect, response)
      }
      if ('error' in result) {
        if (handleError) {
          return handleError(result.error, input, context)
        }
        const data = { error: { message: `${result.error}` } }
        return new Response(JSON.stringify(data), {
          ...{ status: 500 },
          ...response,
        })
      }
      if (!result.data) {
        return new Response(null, { ...{ status: 204 }, ...response })
      }

      response.status = result.status ?? 200

      if (result.contentType) {
        response.headers.set('Content-Type', result.contentType)
        return new Response(result.data, response)
      }

      return result.data
    },
  }
  return adapter
}

async function parseBody(request: Request) {
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
      if (value.value) {
        data.append(key.value, value.value as string)
      }
    }
    return parse(data.toString(), {
      allowDots: true,
      arrayLimit: 500,
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
