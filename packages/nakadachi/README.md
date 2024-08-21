# 媒 - Nakadachi

A interaction connector bypass any WAFs.

## installation

```
npm i @rym-lib/nakadachi
```

## Usage

```ts
const app = nakadachi(createAdapter(args, onError))
app.on('prepare', async ({ input }) => {
  args.context.logger.debug('[app] prepare', {
    method: input.method,
    url: input.url,
  })
})

const main = async () => {
  return await app.interact(async (done, input, context) => {
    done({ data: { message: 'hello' } })
  })
}

const onError: ErrorHandler = (error, input, context, response) => {
  if (error instanceof CustomException) {
    return
  }
  throw error
}
```

## Adapters

- [Remix](https://www.npmjs.com/package/@rym-lib/nakadachi-adapter-remix)
