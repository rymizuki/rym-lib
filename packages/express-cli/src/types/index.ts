import type { Express, Request, Response } from 'express'
import type { Command } from 'commander'

export interface CliRequest {
  method: string
  path: string
  headers?: Record<string, string>
  body?: string | object
  query?: Record<string, string>
}

export interface CliResponse {
  statusCode: number
  headers: Record<string, string>
  body: string
}

export interface BatchOptions {
  parallel?: boolean
  maxConcurrency?: number
  continueOnError?: boolean
  timeout?: number
  retries?: number
}

export interface CliAdapterOptions {
  verbose?: boolean
  configFile?: string
  batchOptions?: BatchOptions
}

export interface ExpressCliCommand extends Command {
  expressCli: (app: Express, options?: CliAdapterOptions) => ExpressCliCommand
}

export interface RequestBuilderOptions {
  method?: string
  headers?: string
  body?: string
  query?: string
}

export interface BatchRequest {
  command: string
  options: RequestBuilderOptions
}