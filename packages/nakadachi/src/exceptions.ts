/**
 * @see https://future-architect.github.io/typescript-guide/exception.html#typescript
 */
export abstract class Exception extends Error {
  constructor(message?: string) {
    super(message)
    this.name = new.target.name

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }

    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class NakadachiTimeoutException extends Exception {}
