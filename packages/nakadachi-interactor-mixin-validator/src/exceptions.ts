import { ZodIssue } from 'zod'

import { Exception } from '@rym-lib/exception'

export class InvalidParameterRequestException extends Exception {
  constructor(
    public data: any,
    public issues: ZodIssue[],
  ) {
    super(`invalid parameter`)
  }
}
