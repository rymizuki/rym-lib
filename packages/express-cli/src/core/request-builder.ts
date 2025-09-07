import type { Request } from 'express'
import type { CliRequest, RequestBuilderOptions } from '../types/index.js'

export class RequestBuilder {
  static fromCliArgs(
    path: string,
    options: RequestBuilderOptions
  ): CliRequest {
    const method = (options.method || 'GET').toUpperCase()
    
    let headers: Record<string, string> = {}
    if (options.headers) {
      try {
        headers = JSON.parse(options.headers)
      } catch (error) {
        throw new Error(`Invalid headers JSON: ${options.headers}`)
      }
    }

    let body: string | object | undefined
    if (options.body) {
      if (options.body.startsWith('@')) {
        const fs = require('fs')
        const filePath = options.body.slice(1)
        try {
          const fileContent = fs.readFileSync(filePath, 'utf-8')
          body = JSON.parse(fileContent)
        } catch (error) {
          throw new Error(`Failed to read or parse file: ${filePath}`)
        }
      } else {
        try {
          body = JSON.parse(options.body)
        } catch {
          body = options.body
        }
      }
    }

    let query: Record<string, string> = {}
    if (options.query) {
      try {
        query = JSON.parse(options.query)
      } catch (error) {
        throw new Error(`Invalid query JSON: ${options.query}`)
      }
    }

    return {
      method,
      path,
      headers,
      body,
      query
    }
  }

  static toExpressRequest(cliRequest: CliRequest): Partial<Request> {
    return {
      method: cliRequest.method,
      path: cliRequest.path,
      url: cliRequest.path,
      headers: cliRequest.headers || {},
      body: cliRequest.body,
      query: cliRequest.query || {}
    }
  }
}