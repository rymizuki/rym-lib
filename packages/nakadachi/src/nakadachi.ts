import { NakadachiTimeoutException } from './exceptions'
import {
  DoneFunction,
  InputPort,
  NakadachiAdapterInterface,
  NakadachiContext,
  NakadachiInterface,
  NakadachiMiddleware,
  NakadachiOption,
  NakadachiRequestHandler,
  NakadachiResponse,
  NakadachiResult,
} from './interfaces'
import { EventEmitter } from './lib/events'

interface Events<OutputPort = any> {
  prepare: {
    input: InputPort
    context: NakadachiContext
    response: NakadachiResponse
  }
  resolve: {
    result: NakadachiResult | undefined
    input: InputPort
    context: NakadachiContext
    response: NakadachiResponse
  }
  response: {
    response: OutputPort
    input: InputPort
    context: NakadachiContext
  }
}

export function nakadachi<OutputPort = any>(
  adapter: NakadachiAdapterInterface<OutputPort>,
  options: Partial<NakadachiOption> = {},
) {
  return new Nakadachi<OutputPort>(adapter, options)
}

export class Nakadachi<OutputPort = any>
  implements NakadachiInterface<OutputPort>
{
  private options: NakadachiOption
  private events: EventEmitter<Events<OutputPort>>
  private middlewares: NakadachiMiddleware[] = []

  constructor(
    private adapter: NakadachiAdapterInterface<OutputPort>,
    options: Partial<NakadachiOption> = {},
  ) {
    this.events = new EventEmitter<Events<OutputPort>>()
    this.options = {
      timeout: 1 * 60 * 1000,
      ...options,
    }
  }

  on<Name extends keyof Events, P extends Events[Name]>(
    name: Name,
    fn: (payload: P) => Promise<void>,
  ) {
    this.events.on(name, fn)
  }

  use(middleware: NakadachiMiddleware) {
    this.middlewares.push(middleware)
    return this
  }

  async interact<Data = any>(handler: NakadachiRequestHandler) {
    const responseInit: NakadachiResponse = {
      headers: new Headers(),
    }
    let result: NakadachiResult | undefined

    const context = this.createContext()
    const input = await this.createInput()

    try {
      for (const middleware of this.middlewares) {
        if (middleware.prepare) {
          const hook = middleware.prepare
          this.on('prepare', async ({ input, context }) => {
            await hook(input, context)
          })
        }
        if (middleware.resolve) {
          const hook = middleware.resolve
          this.on('resolve', async ({ result, input, context }) => {
            await hook(result, input, context)
          })
        }
      }

      await this.events.emit('prepare', {
        context,
        input,
        response: responseInit,
      })

      result = await timer(async () => {
        return await new Promise(async (resolve, reject) => {
          const done: DoneFunction<Data> = (ret) => {
            resolve(ret)
          }
          try {
            await handler(done, input, context)
          } catch (error) {
            reject(error)
          }
        })
      }, this.options.timeout)
      await this.events.emit('resolve', {
        result,
        input,
        context,
        response: responseInit,
      })
    } catch (error) {
      result = { error }
    }
    if (!result) {
      result = { data: null, status: 204 }
    }

    const response = await this.createResponse(
      result,
      input,
      context,
      responseInit,
    )
    await this.events.emit('response', {
      response,
      input,
      context,
    })
    return response
  }

  private createContext() {
    return this.adapter.createContext({
      options: this.options,
    })
  }

  private createInput() {
    return this.adapter.createInput()
  }

  private async createResponse(
    result: NakadachiResult,
    input: InputPort,
    context: NakadachiContext,
    responseInit: NakadachiResponse,
  ) {
    return await this.adapter.createResponse(
      result,
      input,
      context,
      responseInit,
    )
  }
}

async function timer<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
  return await new Promise<T>(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new NakadachiTimeoutException())
    }, timeoutMs)

    try {
      resolve(await fn())
    } catch (error) {
      reject(error)
    } finally {
      clearTimeout(timeout)
    }
  })
}
