import { QueryLoggerInterface, QueryRunnerContext } from '../'

class DummyLogger implements QueryLoggerInterface {
  verbose(_message: string, _payload?: any): void {}
  info(_message: string, _payload?: any): void {}
  error(_message: string, _error: Error): void {}
}

export const createRunnerContext = () => {
  const ctx: QueryRunnerContext = {
    logger: new DummyLogger(),
  }
  return ctx
}
