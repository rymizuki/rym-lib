import { Exception } from '@rym-lib/exception'

export abstract class HTTPException extends Exception {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

export class MethodNotAllowedException extends HTTPException {
  constructor() {
    super(405, 'Method Not Allowed')
  }
}
