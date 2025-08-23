# nakadachi-adapter-remix

A adapter for [nakadachi](https://www.npmjs.com/package/@rym-lib/nakadachi) with [Remix](https://remix.run/).

## Installation

```
npm i @rym-lib/nakadachi
npm i @rym-lib/nakadachi-adapter-remix
```

## Usage

```tsx
import { LoaderFunction, redirect, json } from '@remix-run/node'
import { nakadachi } from '@rym-lib/nakadachi'
import { createAdapter } from '@rym-lib/nakadachi-adapter-remix'

export const loader: LoaderFunction = async (args) => {
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

const onError: ErrorHandler = (error, input, context, response) => {
  if (error instanceof UnauthorizedException) {
    return redirect('/login')
  }
  if (error instanceof InvalidRequestParameterException) {
    return json({ error })
  }
  throw error
}
```
