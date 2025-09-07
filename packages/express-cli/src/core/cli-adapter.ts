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
        app: this.app
      } as Request

      const res = {
        ...response,
        locals: {}
      } as Response

      res.end = () => {
        resolve(getResult())
        return res
      }

      try {
        this.app.handle(req, res, (err?: Error) => {
          if (err) {
            reject(err)
          } else {
            resolve(getResult())
          }
        })
      } catch (error) {
        reject(error)
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