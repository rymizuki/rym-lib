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
  Adapter extends NakadachiAdapterInterface<Output>,
>(
  createAdapter: (...args: any[]) => Adapter,
  options: Partial<NakadachiOption> = {},
) {
  return new App<Data, Output, Adapter>(createAdapter, options)
}

class App<Data, Output, Adapter extends NakadachiAdapterInterface<Output>> {
  constructor(
    private createAdapter: (...args: any[]) => Adapter,
    private options: Partial<NakadachiOption> = {},
  ) {}

  createInteractor(
    name: string,
    Interactor: Newable<InteractionPort<Data>>,
    modules: ModuleInput[],
    middlewares: NakadachiMiddleware[] = [],
  ) {
    const { identifier, bundler } = this.createBundler(
      name,
      modules,
      Interactor,
    )
    const interactor = async (...args: any[]) => {
      const app = nakadachi(this.createAdapter(...args), this.options)

      for (const middleware of middlewares) {
        app.use(middleware)
      }

      return await app.interact(async (done, input, context) => {
        if (!context.container) {
          throw new Error(
            'Dose not defined container in context. Interactor must be required.',
          )
        }
        const container = context.container.createChild()
        container.load(...bundler.resolve())
        const interaction = container.get<InteractionPort<Data>>(identifier)
        await interaction.interact(done, input, context)
      })
    }
    return { identifier, bundler, interactor }
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
}
