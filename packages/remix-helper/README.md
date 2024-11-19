# @rym-lib/remix-helper

## Installation

```
npm i @rym-lib/remix-helper
```

## Features

### useBreadcrumbs()

```tsx:root.tsx
import { useBreadcrumbs } from '@rym-lib/remix-helper'
import { Breadcrumb } from '~/components/breadcrumbs'

export default function App() {
  const items = useBreadcrumbs()

  return (
    <html>
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <div className="container">
          <Breadcrumb items={items} />
          <Outlet />
        </div>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}
```

```tsx:routes/home.examples.$id.tsx
import { RouteHandle } from '@rym-lib/remix-helper'

export const handle: RouteHandle = {
  breadcrumbs: ({ params }) => [
    { label: 'Home', to: '/' },
    { label: 'Examples', to: '/examples' },
    { label: `ID: ${params.id}` },
  ]
}
```

### useFlashMessage()

on previous page, trigger navigation with `state: {message: "anything"}`.

```tsx
<Link to="/" state={{ message: 'hello world' }} />
```

display message when route has `state.message`

```tsx:routes/_index.tsx
import { useFlashMessage } from '@rym-lib/remix-helper'
import { Alert } from '~/components/alert'

export default function RouteView() {
  const { message, close } = useFlashMessage()

  return (
    <div className="container">
      <Alert onClose={close}>{message}</Alert>
    </div>
  )
}
```

### useQueryParams()

```tsx:routes/_index.tsx
import { useQueryParams } from '@rym-lib/remix-helper'

export default function RouteView() {
  // ?filter[created][gte]=2024-01-01&filter[created][lte]=2024-01-31
  const { params } = useQueryParams<{
    filter: {
      created: {
        gte: string
        lte: string
      }
    }
  }>()

  console.log(params) // { filter: { created: { gte: "2024-01-01", lte: "2024-01-31" }}}
}
```
