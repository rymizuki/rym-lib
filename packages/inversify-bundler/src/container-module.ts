import {
  interfaces,
  ContainerModule as InversifyContainerModule,
} from 'inversify'

interface ContainerModuleInterface extends interfaces.ContainerModule {
  name: string
}

type ContainerModuleOptions = {
  name: string
}

class ContainerModule
  extends InversifyContainerModule
  implements ContainerModuleInterface
{
  constructor(
    registry: interfaces.ContainerModuleCallBack,
    private options: Partial<ContainerModuleOptions> = {},
  ) {
    super(registry)
  }

  get name() {
    return this.options.name ?? this.registry.toString()
  }
}

export { ContainerModule }
export type { ContainerModuleInterface }
