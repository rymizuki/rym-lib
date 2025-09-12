import type { Response } from 'express'
import type { CliResponse } from '../types/index.js'

export class ResponseHandler {
  static fromExpressResponse(res: Response): CliResponse {
    const statusCode = res.statusCode || 200
    const headers = res.getHeaders() as Record<string, string>
    
    return {
      statusCode,
      headers,
      body: ''
    }
  }

  static createMockResponse(): {
    response: Partial<Response>
    getResult: () => CliResponse
  } {
    let statusCode = 200
    let headers: Record<string, string> = {}
    let body: string = ''

    const response: Partial<Response> = {
      statusCode: 200,
      status: (code: number) => {
        statusCode = code
        response.statusCode = code
        return response as Response
      },
      set: (field: string | Record<string, string>, value?: string) => {
        if (typeof field === 'string' && value) {
          headers[field.toLowerCase()] = value
        } else if (typeof field === 'object') {
          Object.entries(field).forEach(([key, val]) => {
            headers[key.toLowerCase()] = val
          })
        }
        return response as Response
      },
      setHeader: (name: string, value: string | string[] | number) => {
        headers[name.toLowerCase()] = String(value)
        return response as Response
      },
      getHeaders: () => headers,
      json: (obj: any) => {
        headers['content-type'] = 'application/json'
        body = JSON.stringify(obj)
        return response as Response
      },
      send: (data: any) => {
        if (typeof data === 'string') {
          body = data
          if (!headers['content-type']) {
            headers['content-type'] = 'text/plain'
          }
        } else {
          body = JSON.stringify(data)
          headers['content-type'] = 'application/json'
        }
        return response as Response
      },
      end: () => {
        return response as Response
      }
    }

    const getResult = (): CliResponse => ({
      statusCode,
      headers,
      body
    })

    return { response, getResult }
  }

  static formatOutput(cliResponse: CliResponse, verbose: boolean = false): string {
    if (verbose) {
      let parsedBody = cliResponse.body
      if (cliResponse.body) {
        try {
          parsedBody = JSON.parse(cliResponse.body)
        } catch {
          // Keep as string if not valid JSON
          parsedBody = cliResponse.body
        }
      }
      return JSON.stringify({
        statusCode: cliResponse.statusCode,
        headers: cliResponse.headers,
        body: parsedBody
      }, null, 2)
    }

    // Check content-type in a case-insensitive way
    const contentType = Object.keys(cliResponse.headers).find(key => 
      key.toLowerCase() === 'content-type'
    )
    
    if (contentType && cliResponse.headers[contentType]?.toLowerCase().includes('application/json')) {
      try {
        return JSON.stringify(JSON.parse(cliResponse.body), null, 2)
      } catch {
        return cliResponse.body
      }
    }

    return cliResponse.body
  }
}