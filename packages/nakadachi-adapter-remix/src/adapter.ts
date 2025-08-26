import { parse, ParsedQs } from 'qs'

import { json, TypedResponse, redirect } from '@remix-run/node'
import {
  NakadachiAdapterInterface,
  InputPort,
  Input,
  NakadachiContext,
  NakadachiResult,
  NakadachiResponse,
  Queries,
} from '@rym-lib/nakadachi'

import { parseBody } from './functions/parse-body'
import { ErrorHandler } from './interfaces'
import { ServerFunctionArgs } from './interfaces'

const PARSE_ARRAY_LIMIT = 1000

function convertParsedQsToQueries(parsedQs: ParsedQs): Queries {
  const result: Queries = {}
  for (const [key, value] of Object.entries(parsedQs)) {
    if (value === undefined) {
      result[key] = undefined
    } else if (typeof value === 'string') {
      result[key] = value
    } else if (Array.isArray(value)) {
      // 配列内のアイテムを適切に型変換
      const hasNestedObjects = value.some(item => typeof item === 'object')
      if (hasNestedObjects) {
        result[key] = value.map(item => 
          typeof item === 'string' ? item : convertParsedQsToQueries(item)
        ) as Queries[]
      } else {
        result[key] = value as string[]
      }
    } else {
      result[key] = convertParsedQsToQueries(value)
    }
  }
  return result
}

export class Adapter implements NakadachiAdapterInterface<TypedResponse> {
  constructor(
    private args: ServerFunctionArgs,
    private onError?: ErrorHandler,
  ) {}

  async createInput(): Promise<InputPort> {
    const { request, params } = this.args
    const { method, headers } = request
    const url = new URL(request.url)
    const parsedQueries = parse(url.search, {
      ignoreQueryPrefix: true,
      arrayLimit: PARSE_ARRAY_LIMIT,
    })
    const queries = convertParsedQsToQueries(parsedQueries)
    const body = /^HEAD|GET$/.test(method)
      ? null
      : /^DELETE$/.test(method) && !headers.get('Content-Type')
        ? null
        : await parseBody(request)
    return new Input({
      params,
      headers,
      method,
      url,
      queries,
      body,
    })
  }

  createContext(context: Partial<NakadachiContext>) {
    for (const prop in this.args.context) {
      if (!Object.prototype.hasOwnProperty.call(this.args.context, prop)) {
        continue
      }

      ;(context as any)[prop] = this.args.context[prop]
    }
    return context as NakadachiContext
  }

  async createResponse(
    result: NakadachiResult,
    input: InputPort,
    context: NakadachiContext,
    response: NakadachiResponse,
  ): Promise<TypedResponse> {
    if ('redirect' in result) {
      if (result.status) {
        response.status = result.status
      }
      return redirect(result.redirect, response)
    }
    if ('error' in result) {
      if (this.onError) {
        return this.onError(result.error, input, context, response)
      }
      const data = { error: { message: `${result.error}` } }
      return json(data, { ...{ status: 500 }, ...response })
    }
    if (!result.data) {
      return new Response(null, { ...{ status: 204 }, ...response })
    }

    response.status = result.status ?? 200

    if (result.contentType) {
      response.headers.set('Content-Type', result.contentType)
      return new Response(result.data, response)
    }

    return json(result.data, response)
  }
}
