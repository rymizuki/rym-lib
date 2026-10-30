import { ContainerModule } from './container-module'

interface BundlerPort {
  resolve(): ContainerModule[]
}

type ModuleInput = ContainerModule | BundlerPort

class Bundler implements BundlerPort {
  private inputs: ModuleInput[]
  private excludes: ModuleInput[] = []

  constructor(...inputs: ModuleInput[]) {
    this.inputs = inputs
  }

  resolve(): ContainerModule[] {
    const exists = new Map<string, boolean>()
    const modules = this.flatten(this.inputs).filter((module) => {
      if (exists.get(module.name)) {
        return false
      }
      exists.set(module.name, true)
      return true
    })

    const excluded = new Set(
      this.flatten(this.excludes).map((module) => module.name),
    )
    return modules.filter((module) => !excluded.has(module.name))
  }

  exclude(...inputs: ModuleInput[]): Bundler {
    const bundler = new Bundler(this)
    bundler.excludes = inputs
    return bundler
  }

  private flatten(inputs: ModuleInput[]): ContainerModule[] {
    return inputs
      .map((module) => {
        if (module instanceof ContainerModule) {
          return module
        }
        return module.resolve()
      })
      .flat()
  }
}

export { Bundler }
export type { ModuleInput }
