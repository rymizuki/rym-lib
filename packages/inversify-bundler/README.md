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
