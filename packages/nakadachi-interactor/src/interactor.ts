import {
  Bundler,
  ContainerInterface,
  ContainerModule,
  ModuleInput,
  Newable,
} from '@rym-lib/inversify-bundler'
import {
  DoneFunction,
  InputPort,
  nakadachi,
  NakadachiAdapterInterface,
  NakadachiContext,
  NakadachiMiddleware,
  NakadachiOption,
} from '@rym-lib/nakadachi'

import { RouterPort, Router } from './dispatcher'
import { MethodNotAllowedException } from './exceptions'

declare module '@rym-lib/nakadachi' {
  interface NakadachiContext {
    container: ContainerInterface
  }
}

export interface InteractionPort<Data> {
  interact(
    done: DoneFunction<Data>,
    input: InputPort,
    context: NakadachiContext,
  ): Promise<void>
}

export function builder<
  Data,
  Output,
  Adapter extends
    NakadachiAdapterInterface<Output> = NakadachiAdapterInterface<Output>,
>(
  createAdapter: (...args: any[]) => Adapter,
  options: Partial<NakadachiOption> = {},
) {
  return new App<Data, Output, Adapter>(createAdapter, options)
}

type CreateInteractorResult<Output> = {
  identifier: symbol
  bundler: Bundler
  interactor: (...args: any[]) => Promise<Output>
}

export interface BuilderPort<Data, Output> {
  createInteractor(
    name: string,
    Interactor: Newable<InteractionPort<Data>>,
    modules: ModuleInput[],
    middlewares?: NakadachiMiddleware[],
  ): CreateInteractorResult<Output>
  createInteractor(
    registry: (router: RouterPort<Data>) => RouterPort<Data>,
    middlewares: NakadachiMiddleware[],
  ): CreateInteractorResult<Output>
}

export class App<
  Data,
  Output,
  Adapter extends NakadachiAdapterInterface<Output>,
> implements BuilderPort<Data, Output>
{
  constructor(
    private createAdapter: (...args: any[]) => Adapter,
    private options: Partial<NakadachiOption> = {},
  ) {}

  createInteractor<D extends Data>(
    ...args:
      | [
          string,
          Newable<InteractionPort<D>>,
          ModuleInput[],
          NakadachiMiddleware[]?,
        ]
      | [(router: RouterPort<D>) => RouterPort<D>, NakadachiMiddleware[]]
  ) {
    if (args.length === 2) {
      const [dispatch, middlewares] = args
      const router = dispatch(new Router())
      const bundler = new Bundler(
        ...router.modules,
        new ContainerModule((bind) => {
          for (const Interactor of router.interactor) {
            bind(Interactor).toSelf()
          }
        }),
      )

      const identifier = Symbol.for('Interactor')
      const interactor = async (...args: any[]) => {
        const app = this.createApp(args, middlewares)

        return await app.interact(async (done, input, context) => {
          const route = router.match(input.method)
          if (!route) {
            throw new MethodNotAllowedException()
          }
          if (!context.container) {
            throw new Error(
              'Dose not defined container in context. Interactor must be required.',
            )
          }
          const container = this.createContainer(context.container, bundler)
          const interaction = container.get<InteractionPort<D>>(
            route.Interactor,
          )
          await interaction.interact(done, input, context)
        })
      }
      return {
        identifier,
        bundler,
        interactor,
      }
    } else {
      const [name, Interactor, modules, middlewares] = args as [
        string,
        Newable<InteractionPort<D>>,
        ModuleInput[],
        NakadachiMiddleware[]?,
      ]
      const { identifier, bundler } = this.createBundler(
        name,
        modules,
        Interactor,
      )
      const interactor = async (...args: any[]) => {
        const app = this.createApp(args, middlewares)

        return await app.interact(async (done, input, context) => {
          if (!context.container) {
            throw new Error(
              'Dose not defined container in context. Interactor must be required.',
            )
          }
          const container = this.createContainer(context.container, bundler)
          const interaction = container.get<InteractionPort<D>>(identifier)
          await interaction.interact(done, input, context)
        })
      }
      return { identifier, bundler, interactor }
    }
  }

  private createApp(args: any[], middlewares: NakadachiMiddleware[] = []) {
    const app = nakadachi(this.createAdapter(...args), this.options)

    for (const middleware of middlewares ?? []) {
      app.use(middleware)
    }

    return app
  }

  private createBundler(
    name: string,
    modules: ModuleInput[],
    Interactor: Newable<InteractionPort<Data>>,
  ) {
    const identifier = Symbol.for(name)
    const bundler = new Bundler(
      ...modules,
      new ContainerModule((bind) => {
        bind<InteractionPort<Data>>(identifier).to(Interactor)
      }),
    )
    return {
      identifier,
      bundler,
    }
  }

  private createContainer(parent: ContainerInterface, bundler: Bundler) {
    const container = parent.createChild()
    container.load(...bundler.resolve())
    return container
  }
}
