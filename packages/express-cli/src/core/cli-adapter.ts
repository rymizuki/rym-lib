import type { Express, Request, Response } from 'express'
import type { CliRequest, CliResponse, CliAdapterOptions } from '../types/index.js'
import { RequestBuilder } from './request-builder.js'
import { ResponseHandler } from './response-handler.js'

export class CliAdapter {
  constructor(
    private app: Express,
    private options: CliAdapterOptions = {}
  ) {}

  async executeRequest(cliRequest: CliRequest): Promise<CliResponse> {
    const expressRequest = RequestBuilder.toExpressRequest(cliRequest)
    const { response, getResult } = ResponseHandler.createMockResponse()

    return new Promise((resolve, reject) => {
      const req = {
        ...expressRequest,
        app: this.app,
        params: {},
        route: undefined
      } as Request

      const res = {
        ...response,
        locals: {},
        finished: false
      } as Response

      // Override end to resolve the promise
      const originalEnd = res.end
      res.end = (data?: any) => {
        if (!res.finished) {
          res.finished = true
          if (data !== undefined) {
            if (typeof data === 'string') {
              (res as any).body = data
            }
          }
          resolve(getResult())
        }
        return res
      }

      try {
        // Use setTimeout to avoid infinite waiting
        const timeout = setTimeout(() => {
          if (!res.finished) {
            res.finished = true
            resolve(getResult())
          }
        }, 100)

        this.app.handle(req, res, (err?: Error) => {
          clearTimeout(timeout)
          if (err) {
            if (!res.finished) {
              res.finished = true
              reject(err)
            }
          } else {
            if (!res.finished) {
              res.finished = true
              resolve(getResult())
            }
          }
        })
      } catch (error) {
        if (!res.finished) {
          res.finished = true
          reject(error)
        }
      }
    })
  }

  async executeBatch(requests: CliRequest[]): Promise<CliResponse[]> {
    const batchOptions = this.options.batchOptions

    if (batchOptions?.parallel !== false) {
      const promises = requests.map(request => 
        this.executeRequest(request).catch(error => {
          if (batchOptions?.continueOnError) {
            return {
              statusCode: 500,
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ error: error.message })
            }
          }
          throw error
        })
      )

      return Promise.all(promises)
    } else {
      const results: CliResponse[] = []
      
      for (const request of requests) {
        try {
          const result = await this.executeRequest(request)
          results.push(result)
        } catch (error) {
          if (batchOptions?.continueOnError) {
            results.push({
              statusCode: 500,
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ error: (error as Error).message })
            })
          } else {
            throw error
          }
        }
      }
      
      return results
    }
  }
}