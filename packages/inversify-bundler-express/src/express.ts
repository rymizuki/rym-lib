import { Request, RequestHandler, Response } from 'express'

import {
  Bundler,
  Container,
  ContainerInterface,
  ModuleInput,
} from '@rym-lib/inversify-bundler'

declare module 'express-serve-static-core' {
  interface Request {
    container: ContainerInterface
  }
}

export const container = (
  ...modules: (ModuleInput | ((req: Request, res: Response) => Bundler))[]
) => {
  const handler: RequestHandler = (req, res, next) => {
    const bundler = new Bundler(
      ...modules.map((module) =>
        typeof module === 'function' ? module(req, res) : module,
      ),
    )

    const container = new Container()
    container.load(...bundler.resolve())

    req.container = container

    next()
  }

  return handler
}
