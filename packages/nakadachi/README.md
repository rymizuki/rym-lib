# 媒 - Nakadachi

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
