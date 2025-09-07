import type { Request } from 'express'
import type { CliRequest, RequestBuilderOptions } from '../types/index.js'

export class RequestBuilder {
  static fromCliArgs(
    path: string,
    options: RequestBuilderOptions & Record<string, any>
  ): CliRequest {
    const method = (options.method || 'GET').toUpperCase()
    
    // Normalize path: replace spaces with slashes and ensure leading slash
    const normalizedPath = '/' + path.replace(/ /g, '/').replace(/^\/+/, '')
    
    let headers: Record<string, string> = {}
    if (options.headers) {
      try {
        headers = JSON.parse(options.headers)
      } catch (error) {
        throw new Error(`Invalid headers JSON: ${options.headers}`)
      }
    }
    
    // Parse --header 'key: value' format
    if (options.header) {
      const headerArray = Array.isArray(options.header) ? options.header : [options.header]
      headerArray.forEach((headerStr: string) => {
        const colonIndex = headerStr.indexOf(':')
        if (colonIndex === -1) {
          throw new Error(`Invalid header format: ${headerStr}. Expected 'key: value'`)
        }
        const key = headerStr.slice(0, colonIndex).trim().toLowerCase()
        const value = headerStr.slice(colonIndex + 1).trim()
        headers[key] = value
      })
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
    
    // Extract query parameters from --key=value options
    const reservedKeys = ['method', 'headers', 'header', 'body', 'query', 'verbose']
    Object.keys(options).forEach(key => {
      if (!reservedKeys.includes(key) && key !== '_' && !key.startsWith('$')) {
        query[key] = String(options[key])
      }
    })

    return {
      method,
      path: normalizedPath,
      headers,
      body,
      query
    }
  }

  static toExpressRequest(cliRequest: CliRequest): Partial<Request> {
    // Build URL with query parameters
    const queryString = Object.keys(cliRequest.query || {})
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(cliRequest.query![key])}`)
      .join('&')
    
    const url = queryString ? `${cliRequest.path}?${queryString}` : cliRequest.path
    
    return {
      method: cliRequest.method,
      path: cliRequest.path,
      url,
      headers: cliRequest.headers || {},
      body: cliRequest.body,
      query: cliRequest.query || {}
    }
  }
}