import type { BatchRequest, CliRequest, BatchOptions } from '../types/index.js'
import { RequestBuilder } from '../core/request-builder.js'

export class BatchProcessor {
  static parseCommands(commands: string[]): BatchRequest[] {
    return commands.map(command => {
      const parts = command.trim().split(/\s+/)
      const path = parts[0]
      if (!path) {
        throw new Error(`Invalid command: ${command}`)
      }
      const options: any = {}

      for (let i = 1; i < parts.length; i++) {
        const part = parts[i]
        if (!part) continue
        if (part.startsWith('--')) {
          const [key, ...valueParts] = part.substring(2).split('=')
          if (!key) continue
          if (valueParts.length > 0) {
            options[key] = valueParts.join('=')
          } else if (i + 1 < parts.length && parts[i + 1] && !parts[i + 1]!.startsWith('--')) {
            options[key] = parts[++i]
          } else {
            options[key] = true
          }
        }
      }

      return { command: path, options }
    })
  }

  static batchRequestsToCliRequests(batchRequests: BatchRequest[]): CliRequest[] {
    return batchRequests.map(({ command, options }) => 
      RequestBuilder.fromCliArgs(command, options)
    )
  }

  static validateBatchOptions(options: BatchOptions): void {
    if (options.maxConcurrency !== undefined && options.maxConcurrency <= 0) {
      throw new Error('maxConcurrency must be greater than 0')
    }
    if (options.timeout !== undefined && options.timeout <= 0) {
      throw new Error('timeout must be greater than 0')
    }
    if (options.retries !== undefined && options.retries < 0) {
      throw new Error('retries must be non-negative')
    }
  }
}