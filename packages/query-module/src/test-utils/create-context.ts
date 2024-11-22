import { QueryLoggerInterface, QueryRunnerContext } from '../'

class DummyLogger implements QueryLoggerInterface {
  verbose(message: string, payload?: any): void {}
  info(message: string, payload?: any): void {}
  error(message: string, error: Error): void {}
}

export const createRunnerContext = () => {
  const ctx: QueryRunnerContext = {
    logger: new DummyLogger(),
  }
  return ctx
}
