import {
  ContainerModule as InversifyContainerModule,
  ContainerModuleLoadOptions,
} from 'inversify'

interface ContainerModuleInterface {
  name: string
  id: number
  load(options: ContainerModuleLoadOptions): void | Promise<void>
}

type ContainerModuleCallback = (
  options: ContainerModuleLoadOptions,
) => void | Promise<void>

type ContainerModuleOptions = {
  name: string
}

class ContainerModule
  extends InversifyContainerModule
  implements ContainerModuleInterface
{
  private _name: string | undefined

  constructor(
    load: ContainerModuleCallback,
    private options: Partial<ContainerModuleOptions> = {},
  ) {
    super(load)
    this._name = options.name
  }

  get name() {
    return this._name ?? `module-${this.id}`
  }
}

export { ContainerModule }
export type { ContainerModuleInterface, ContainerModuleCallback }
