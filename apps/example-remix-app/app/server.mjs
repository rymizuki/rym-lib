import express from 'express'
import http from 'http'

import { createRequestHandler } from '@remix-run/express'
import { installGlobals } from '@remix-run/node'
import { container } from '@rym-lib/inversify-bundler-express'

installGlobals()

const viteDevServer =
  process.env.NODE_ENV === 'production'
    ? undefined
    : await import('vite').then((vite) =>
        vite.createServer({
          server: { middlewareMode: true },
        }),
      )

const app = express()

if (viteDevServer) {
  app.use(viteDevServer.middlewares)
} else {
  app.use(
    '/assets',
    express.static('/build/client/assets', { immutable: true, maxAge: '1y' }),
  )
}

app.use(express.static('/build/client', { maxAge: '1h' }))
app.use(container())

app.all(
  '*',
  createRequestHandler({
    build: viteDevServer
      ? () => viteDevServer.ssrLoadModule('virtual:remix/server-build')
      : await import('./build/server/index.js'),
    getLoadContext: (req) => ({
      container: req.container,
    }),
  }),
)

const server = http.createServer(app)
server.listen(3000)
server.on('listening', () => {
  console.info(`App listening on http://localhost:${server.address().port}`)
})
