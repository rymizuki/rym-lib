import { ContainerInterface } from '@rym-lib/inversify-bundler'
import {
  InputPort,
  NakadachiAdapterInterface,
  NakadachiContext,
  NakadachiResponse,
  NakadachiResult,
} from '@rym-lib/nakadachi'

export class MockAdapter implements NakadachiAdapterInterface<any> {
  constructor(
    private args: {
      request: Request
    },
    private container: ContainerInterface,
  ) {}

  async createInput(): Promise<InputPort> {
    return {
      params: {},
      queries: {},
      body: null,
      method: this.args.request.method,
      url: new URL(this.args.request.url),
      headers: new Headers(),
    }
  }

  createContext(_context: Partial<NakadachiContext>): NakadachiContext {
    return {
      container: this.container,
      options: {
        timeout: 1000,
      },
    }
  }

  async createResponse(
    result: NakadachiResult,
    _input: InputPort,
    _context: NakadachiContext,
    _response: NakadachiResponse,
  ): Promise<any> {
    return result
  }
}
