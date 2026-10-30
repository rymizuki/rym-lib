import { ContainerModule } from './container-module'

interface BundlerPort {
  resolve(): ContainerModule[]
}

type ModuleInput = ContainerModule | BundlerPort

class Bundler implements BundlerPort {
  private inputs: ModuleInput[]

  constructor(...inputs: ModuleInput[]) {
    this.inputs = inputs
  }

  resolve(): ContainerModule[] {
    const exists = new Map<string, boolean>()
    const modules = this.inputs
      .map((module) => {
        if (module instanceof ContainerModule) {
          return module
        }
        return module.resolve()
      })
      .flat()
      .filter((module) => {
        if (exists.get(module.name)) {
          return false
        }
        exists.set(module.name, true)
        return true
      })

    return modules
  }

  exclude(...inputs: ModuleInput[]): Bundler {
    const excluded = new Set(
      new Bundler(...inputs).resolve().map((module) => module.name),
    )
    return new Bundler(
      ...this.resolve().filter((module) => !excluded.has(module.name)),
    )
  }
}

export { Bundler }
export type { ModuleInput }
