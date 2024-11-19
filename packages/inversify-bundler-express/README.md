# @rym-lib/inversify-bundler-express

## Installation

```
npm i @rym-lib/inversify-bundler
npm i @rym-lib/inversify-bundler-express
```

## Usage

```ts
import 'reflect-metadata'

import express, { Request, Response } from 'express'

import { Bundler, ContainerModule } from '@rym-lib/inversify-bundler'
import { container } from '@rym-lib/inversify-bundler-express'

const app = express()

app.use(
  container((req, res) => {
    return new Bundler(
      new ContainerModule((bind) => {
        bind<Request>('Request').toDynamicValue(() => req)
        bind<Response>('Response').toDynamicValue(() => res)
      }),
    )
  }),
)

app.get('/example', (req) => {
  const response = req.container.get<Response>('Response')
})
```
