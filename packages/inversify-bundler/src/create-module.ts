import { interfaces } from 'inversify'

import { Bundler, ModuleInput } from './bundler'
import { ContainerModule } from './container-module'

class ModuleBuilder<T> {
  constructor(public build: (context: interfaces.Context) => T) {}
}

export function builder<T>(fn: (context: interfaces.Context) => T) {
  return new ModuleBuilder<T>(fn)
}

export function createModule<Port, Context = {}>(
  name: string,
  Module: interfaces.Newable<Port> | ModuleBuilder<Port>,
  modules: ModuleInput[] = [],
  options: { singleton?: boolean } = {},
) {
  const identifier = Symbol.for(name)
  const bundler = new Bundler(
    ...modules,
    new ContainerModule(
      (bind) => {
        const bindingTo = bind<Port>(identifier)
        const binding =
          Module instanceof ModuleBuilder
            ? bindingTo.toDynamicValue((context) => Module.build(context))
            : bindingTo.to(Module)
        if (options.singleton) {
          binding.inSingletonScope()
        }
      },
      {
        name,
      },
    ),
  )
  return { identifier, bundler }
}
