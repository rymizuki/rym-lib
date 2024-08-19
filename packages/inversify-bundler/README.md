# @rym-lib/inversify-bundler

Bundle `ContainerModule` for [inversify](https://github.com/inversify/InversifyJS)

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
