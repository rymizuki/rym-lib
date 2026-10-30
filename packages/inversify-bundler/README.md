# @rym-lib/inversify-bundler

Bundle `ContainerModule` for [inversify](https://github.com/inversify/InversifyJS).
Co-located module bundling solution.

## installation

```
npm i -D @rym-lib/inversify-bundler
```

## Usage

### Module creation

```ts
interface ExamplePort {}

@injectable()
class Example implements ExamplePort {
  constructor(
    @inject(DBIdentifier)
    private db: DBPort,
  ) {}
}

const { identifier: ExampleIdentifier, bundler: ExampleModule } =
  createModule<ExamplePort>('Example', Example, [DBModule])

export { ExampleIdentifier, ExampleModule }
export type { ExamplePort }
```

### Bundling modules

```ts
import { ExampleModule, ExamplePort, ExampleIdentifier } from './example'

const container = new Container()
container.load(...ExampleModule.resolve())

const example = container.get<ExamplePort>(ExampleIdentifier)
```

## `createModule<Interface>(name: string, Module: Newable<Interface>, bindings: ModuleInput[])`

```ts
const { identifier, bundler } = createModule<InteractionPort>(
  'UserRegister',
  UserRegisterInteraction,
  [PrismaModule, LoggerModule],
)
```

### `new ModuleBundler(...modules: ModuleInput[])`

```ts
import { ContainerModule as InversifyContainerModule } from 'inversify'

import { ContainerModule, ModuleBundler } from '@rym-lib/inversify-bundler'

import { LoggerModule } from '~/logger'
import { prisma } from '~/my-prisma'

const name = 'Prisma'
const prismaIdentifier = Symbol.for(name)

const redisIdentifier = Symbol.for('Redis')

const bundler = new Bundler(
  LoggerModule,
  new ContainerModule(
    (bind) => {
      bind<PrismaPort>(prismaIdentifier).toDynamicValue(() => prisma)
    },
    { name },
  ),
  new InversifyContainerModule((bind) => {
    bind<RedisPort>(redisIdentifier).toDynamicValue(() => redis)
  }),
)
```

## resolve module

`resolve()` exclude duplicate module and return flat `ContainerModule` array.
But, can not resolve in already registered container's modules. Use child container.

```ts
import { Container } from 'inversify'

import { bundler } from '~/my-module'

const container = new Container()

container.load(...bundler.resolve())
```

## exclude modules

`exclude(...modules)` returns a new `Bundler` without the modules whose names are resolved from the given modules.
The modules are excluded when `resolve()` is called, in the same way as duplicates are removed.
Modules are identified by name. A `ContainerModule` without a name is named `module-${id}` per instance, so it is excluded only when the same instance is given.
Use it to load into a child container only the modules its parent does not have, so that singletons bound in the parent are shared instead of being created again in the child.

```ts
import { Bundler, Container } from '@rym-lib/inversify-bundler'

import { RootModule } from '~/root-module'
import { UserModule } from '~/user'

const root = new Container()
root.loadSync(...RootModule.resolve())

const child = new Container({ parent: root })
child.loadSync(...new Bundler(UserModule).exclude(RootModule).resolve())
```
