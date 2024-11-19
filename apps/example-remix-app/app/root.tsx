import { LinksFunction, MetaFunction } from '@remix-run/node'
import { Links, Meta, Outlet, Scripts } from '@remix-run/react'
import { useBreadcrumbs } from '@rym-lib/remix-helper'
import { Breadcrumbs, Container, Spacer } from '@rym-lib/ui'
import ui from '@rym-lib/ui/index.css?url'
import { isNotEmpty } from '@rym-lib/utilities'

export const meta: MetaFunction = () => {
  return [
    { title: 'Example' },
    { name: 'description', content: "rym-lib's example site." },
  ]
}

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: ui },
  {
    rel: 'stylesheet',
    href: 'https://use.fontawesome.com/releases/v6.6.0/css/all.css',
    crossOrigin: 'anonymous',
    referrerPolicy: 'no-referrer',
  },
]

export default function App() {
  const items = useBreadcrumbs()
  return (
    <html>
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <Container>
          {isNotEmpty(items) && (
            <Spacer size="sm">
              <Breadcrumbs items={items} />
            </Spacer>
          )}
          <Spacer>
            <Outlet />
          </Spacer>
        </Container>
        <Scripts />
      </body>
    </html>
  )
}
