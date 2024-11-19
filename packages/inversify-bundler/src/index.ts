import { Container, inject, injectable, interfaces } from 'inversify'

import { Bundler, ModuleInput } from './bundler'
import { ContainerModule, ContainerModuleInterface } from './container-module'
import { builder, createModule } from './create-module'

type ServiceIdentifier<T> = interfaces.ServiceIdentifier<T>
type Newable<T> = interfaces.Newable<T>
type ContainerInterface = interfaces.Container

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
  ContainerModuleInterface,
  ModuleInput,
  Newable,
  ServiceIdentifier,
}
