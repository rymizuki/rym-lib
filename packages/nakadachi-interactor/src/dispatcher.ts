import { ModuleInput, Newable } from '@rym-lib/inversify-bundler'

import { InteractionPort } from './interactor'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'
type InteractorConstructor<Data> = Newable<InteractionPort<Data>>
type RouteDefine<Data> = {
  Interactor: InteractorConstructor<Data>
  modules: ModuleInput[]
}

export interface RouterPort<Data> {
  routes: Partial<Record<HttpMethod, RouteDefine<Data>>>
  modules: ModuleInput[]
  interactor: InteractorConstructor<Data>[]

  get(Interactor: InteractorConstructor<Data>, modules: ModuleInput[]): this
  post(Interactor: InteractorConstructor<Data>, modules: ModuleInput[]): this
  put(Interactor: InteractorConstructor<Data>, modules: ModuleInput[]): this
  delete(Interactor: InteractorConstructor<Data>, modules: ModuleInput[]): this

  match(method: string): RouteDefine<Data> | undefined
}

export class Router<Data> implements RouterPort<Data> {
  public routes: Partial<Record<HttpMethod, RouteDefine<Data>>> = {}

  get modules() {
    return (Object.keys(this.routes) as (keyof typeof this.routes)[])
      .map((method) => this.routes[method]?.modules)
      .filter((modules) => !!modules)
      .flat()
  }

  get interactor() {
    return (Object.keys(this.routes) as (keyof typeof this.routes)[])
      .map((method) => this.routes[method]?.Interactor)
      .filter((value) => !!value)
  }

  get(Interactor: InteractorConstructor<Data>, modules: ModuleInput[]) {
    this.routes['GET'] = { Interactor, modules }
    return this
  }
  post(Interactor: InteractorConstructor<Data>, modules: ModuleInput[]) {
    this.routes['POST'] = { Interactor, modules }
    return this
  }
  put(Interactor: InteractorConstructor<Data>, modules: ModuleInput[]) {
    this.routes['PUT'] = { Interactor, modules }
    return this
  }
  delete(Interactor: InteractorConstructor<Data>, modules: ModuleInput[]) {
    this.routes['DELETE'] = { Interactor, modules }
    return this
  }

  match(method: string) {
    return this.routes[method as HttpMethod]
  }
}
