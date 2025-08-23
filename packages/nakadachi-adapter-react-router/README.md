# nakadachi-adapter-react-router

A adapter for [nakadachi](https://www.npmjs.com/package/@rym-lib/nakadachi) with [ReactRouter v7](https://reactrouter.com/).

## Installation

```
npm i @rym-lib/nakadachi
npm i @rym-lib/nakadachi-adapter-react-router
```

## Usage

```tsx
import { redirect, data, useLoaderData } from 'react-router'

import { nakadachi } from '@rym-lib/nakadachi'
import { createAdapter } from '@rym-lib/nakadachi-adapter-react-router'

import type { Route } from './+types/route'

export const loader = async (args: Route.LoaderArgs) => {
  const app = nakadachi(createAdapter(args, onError))

  app.on('prepare', () => {
    // do anything prepare process
  })

  return await app.interact(async (done, input, context) => {
    // do anything interaction process.

    done({
      data: {
        message: 'hello world',
      },
    })
  })
}

const onError: ErrorHandler = (error, input, context) => {
  if (error instanceof UnauthorizedException) {
    return redirect('/login')
  }
  if (error instanceof InvalidRequestParameterException) {
    return data({ error }, { status: 400 })
  }
  throw data({ error }, { status: 500 })
}

export default function RouteView() {
  const { message } = useLoaderData<typeof loader>()

  // ...
}
```
