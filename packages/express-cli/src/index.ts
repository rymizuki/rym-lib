import { Command } from 'commander'
import type { Express } from 'express'
import type { CliAdapterOptions, ExpressCliCommand } from './types/index.js'
import { CliAdapter } from './core/cli-adapter.js'
import { RequestBuilder } from './core/request-builder.js'
import { ResponseHandler } from './core/response-handler.js'
import { BatchProcessor } from './middleware/batch-processor.js'

export function expressCli(
  app: Express, 
  options: CliAdapterOptions = {}
): ExpressCliCommand {
  const program = new Command() as ExpressCliCommand
  const adapter = new CliAdapter(app, options)

  program
    .name('express-cli')
    .description('Execute Express routes from command line')
    .version('0.0.0')

  program
    .argument('<path>', 'Express route path')
    .option('--method <method>', 'HTTP method', 'GET')
    .option('--headers <headers>', 'Request headers as JSON')
    .option('--body <body>', 'Request body as JSON or @file.json')
    .option('--query <query>', 'Query parameters as JSON')
    .option('--verbose', 'Verbose output')
    .action(async (path, options) => {
      try {
        const cliRequest = RequestBuilder.fromCliArgs(path, options)
        const response = await adapter.executeRequest(cliRequest)
        
        const output = ResponseHandler.formatOutput(response, options.verbose)
        console.log(output)
        
        if (response.statusCode >= 400) {
          process.exit(1)
        }
      } catch (error) {
        console.error('Error:', (error as Error).message)
        process.exit(1)
      }
    })

  program
    .command('batch')
    .description('Execute multiple requests')
    .argument('<commands...>', 'Commands to execute')
    .option('--parallel', 'Execute in parallel (default)')
    .option('--series', 'Execute in series')
    .option('--continue-on-error', 'Continue on error')
    .option('--max-concurrency <num>', 'Max concurrent requests', '10')
    .option('--verbose', 'Verbose output')
    .action(async (commands, options) => {
      try {
        const batchOptions = {
          parallel: !options.series,
          continueOnError: options.continueOnError,
          maxConcurrency: parseInt(options.maxConcurrency)
        }

        BatchProcessor.validateBatchOptions(batchOptions)

        const batchRequests = BatchProcessor.parseCommands(commands)
        const cliRequests = BatchProcessor.batchRequestsToCliRequests(batchRequests)
        
        const adapter = new CliAdapter(app, { ...options, batchOptions })
        const responses = await adapter.executeBatch(cliRequests)
        
        responses.forEach((response, index) => {
          console.log(`--- Request ${index + 1} (${cliRequests[index].method} ${cliRequests[index].path}) ---`)
          const output = ResponseHandler.formatOutput(response, options.verbose)
          console.log(output)
          console.log('')
        })
        
        const hasError = responses.some(r => r.statusCode >= 400)
        if (hasError && !options.continueOnError) {
          process.exit(1)
        }
      } catch (error) {
        console.error('Batch Error:', (error as Error).message)
        process.exit(1)
      }
    })

  program.expressCli = (newApp: Express, newOptions?: CliAdapterOptions) => 
    expressCli(newApp, newOptions)

  return program
}

export { CliAdapter } from './core/cli-adapter.js'
export { RequestBuilder } from './core/request-builder.js'
export { ResponseHandler } from './core/response-handler.js'
export { BatchProcessor } from './middleware/batch-processor.js'
export * from './types/index.js'