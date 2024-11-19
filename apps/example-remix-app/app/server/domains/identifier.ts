import { Worker } from 'snowflake-uuid'

import { createModule, injectable } from '@rym-lib/inversify-bundler'

interface ServicePort {
  generateId(): Promise<string>
}

@injectable()
class Service implements ServicePort {
  private generator: Worker

  constructor() {
    this.generator = new Worker(0, 1, {
      workerIdBits: 5,
      datacenterIdBits: 5,
      sequenceBits: 24,
    })
  }

  async generateId() {
    return this.generator.nextId().toString()
  }
}

export const {
  identifier: IdentifierServiceIdentifier,
  bundler: IdentifierServiceModule,
} = createModule('IdentifierService', Service, [])
export type { ServicePort as IdentifierServicePort }
