import { inject, injectable, interfaces } from 'inversify'

import { Bundler, ModuleInput } from './bundler'
import { ContainerModule, ContainerModuleInterface } from './container-module'
import { builder, createModule } from './create-module'

type ServiceIdentifier<T> = interfaces.ServiceIdentifier<T>

export { builder, Bundler, ContainerModule, createModule, inject, injectable }

export type { ContainerModuleInterface, ModuleInput, ServiceIdentifier }
