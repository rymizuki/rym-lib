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
) {
  const identifier = Symbol.for(name)
  const bundler = new Bundler(
    ...modules,
    new ContainerModule(
      (bind) => {
        const binding = bind<Port>(identifier)
        if (Module instanceof ModuleBuilder) {
          binding.toDynamicValue((context) => Module.build(context))
        } else {
          binding.to(Module)
        }
      },
      {
        name,
      },
    ),
  )
  return { identifier, bundler }
}
