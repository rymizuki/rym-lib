import { QueryLoggerInterface } from './interfaces'

export const createLogger = () => {
  const logger: QueryLoggerInterface = {
    verbose(message, payload) {
      console.debug(message, payload)
    },
    info(message, payload) {
      console.info(message, payload)
    },
    error(message, error) {
      console.error(message, error)
    },
  }
  return logger
}
