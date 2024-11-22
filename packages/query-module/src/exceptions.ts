import { Exception } from '@rym-lib/exception'

import { QueryRunnerCriteria } from './interfaces'

export class QueryRunnerResourceNotFoundException extends Exception {
  constructor(
    public resource: string,
    public criteria: QueryRunnerCriteria<any>,
  ) {
    super()
  }
}
