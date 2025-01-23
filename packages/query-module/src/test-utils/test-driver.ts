import { QueryDriverInterface, QueryCriteriaInterface } from '../interfaces'

class TestDriver<Data extends Record<string, any> = Record<string, any>>
  implements QueryDriverInterface
{
  private initial: Data[] = []
  private data: null | Data[] = null
  public readonly called: {
    method: 'execute'
    args: any[]
  }[] = []

  source(fn: (...args: []) => Data[]): this {
    this.initial = fn()
    if (this.data === null) {
      this.data = this.initial
    }
    return this
  }

  async execute<D>(criteria: QueryCriteriaInterface<D>): Promise<Data[]> {
    this.called.push({
      method: 'execute',
      args: [criteria],
    })
    if (this.data) {
      return this.data
    }
    return this.initial
  }

  returns(rows: Data[]) {
    this.data = rows
    return this
  }

  clear() {
    this.data = this.initial
  }
}

export function createDriver() {
  return new TestDriver()
}

export type { TestDriver }
