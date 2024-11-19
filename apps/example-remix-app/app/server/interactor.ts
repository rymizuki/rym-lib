import { data } from '@remix-run/node'
import { ModuleInput, Newable } from '@rym-lib/inversify-bundler'
import {
  DoneFunction,
  InputPort,
  NakadachiContext,
  NakadachiMiddleware,
} from '@rym-lib/nakadachi'
import { createAdapter } from '@rym-lib/nakadachi-adapter-remix'
import { builder, InteractionPort } from '@rym-lib/nakadachi-interactor'
import { InvalidParameterRequestException } from '@rym-lib/nakadachi-interactor-mixin-validator'

export type { DoneFunction, InputPort, InteractionPort, NakadachiContext }

const app = builder(
  (args) =>
    createAdapter(args, (error) => {
      if (error instanceof InvalidParameterRequestException) {
        console.warn(error.message, {
          data: error.data,
          issues: error.issues,
        })
        throw data({ error }, { status: 400 })
      }
      throw error
    }),
  {
    timeout: 5 * 60 * 1000,
  },
)

export function createInteractor<Data>(
  name: string,
  Interactor: Newable<InteractionPort<Data>>,
  modules: ModuleInput[],
  middlewares: NakadachiMiddleware[] = [],
) {
  return app.createInteractor(name, Interactor, modules, middlewares)
}
