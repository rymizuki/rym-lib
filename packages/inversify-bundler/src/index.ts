import {
  Container,
  inject,
  injectable,
  ServiceIdentifier,
  Newable,
  ResolutionContext,
  ContainerModuleLoadOptions,
  ContainerOptions,
} from 'inversify'

import { Bundler, ModuleInput } from './bundler'
import {
  ContainerModule,
  ContainerModuleInterface,
  ContainerModuleCallback,
} from './container-module'
import { builder, createModule } from './create-module'

type ContainerInterface = Container

export {
  builder,
  Bundler,
  Container,
  ContainerModule,
  createModule,
  inject,
  injectable,
}

export type {
  ContainerInterface,
  ContainerModuleCallback,
  ContainerModuleInterface,
  ContainerModuleLoadOptions,
  ContainerOptions,
  ModuleInput,
  Newable,
  ResolutionContext,
  ServiceIdentifier,
}
