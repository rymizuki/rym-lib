import { Exception } from '@rym-lib/exception'

import { QueryRunnerCriteria, QuerySpecification } from './interfaces'

export class QueryRunnerResourceNotFoundException extends Exception {
  constructor(
    public resource: string,
    public criteria: QueryRunnerCriteria<any>,
  ) {
    super(
      `Query Runner could not find record${resource ? ` in "${resource}"` : ''}, by query "${JSON.stringify(criteria)}"`,
    )
  }
}
