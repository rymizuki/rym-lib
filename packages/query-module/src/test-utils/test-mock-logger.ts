import { QueryLoggerInterface } from '../interfaces'

class TestMockLogger implements QueryLoggerInterface {
  verbose() {}
  info() {}
  error() {}
}

function createLogger() {
  return new TestMockLogger()
}

export { TestMockLogger, createLogger }
