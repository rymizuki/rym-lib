import { ContainerModule, ContainerModuleInterface } from './container-module'

interface BundlerPort {
  resolve(): ContainerModuleInterface[]
}

type ModuleInput = ContainerModule | BundlerPort

class Bundler implements BundlerPort {
  private inputs: ModuleInput[]

  constructor(...inputs: ModuleInput[]) {
    this.inputs = inputs
  }

  resolve(): ContainerModuleInterface[] {
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
}

export { Bundler }
export type { ModuleInput }
