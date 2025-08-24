import { PrismaClient } from '@prisma/client'
import {
  QueryCriteriaInterface,
  QueryDriverInterface,
  QueryFilterOperator,
  QueryLoggerInterface,
} from '@rym-lib/query-module'
import {
  buildSQL,
  createBuilder,
  SQLBuilderConditionsPort,
  SQLBuilderPort,
} from '@rym-lib/query-module-sql-builder'

export class QueryDriverPrisma implements QueryDriverInterface {
  private setup: ((builder: SQLBuilderPort) => SQLBuilderPort) | null = null
  private builderSetup: () => SQLBuilderPort

  constructor(
    private db: PrismaClient,
    private context: {
      logger: QueryLoggerInterface
    },
    builderSetup?: () => SQLBuilderPort,
  ) {
    this.builderSetup = builderSetup ? builderSetup : () => createBuilder()
  }

  source(setup: (builder: SQLBuilderPort) => SQLBuilderPort): this {
    this.setup = setup
    return this
  }

  customFilter(
    operator: QueryFilterOperator,
    value: any,
    filter: (
      operator: QueryFilterOperator,
      value: any,
      builder: SQLBuilderPort,
    ) => SQLBuilderPort | SQLBuilderConditionsPort,
  ): SQLBuilderPort | SQLBuilderConditionsPort {
    return filter(operator, value, this.builderSetup())
  }

  async execute<D>(criteria: QueryCriteriaInterface<D>): Promise<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Record<string, any>[]
  > {
    if (!this.setup) {
      throw new Error('QueryDriver must be required source.')
    }

    const [sql, replacements] = buildSQL(
      this.setup(this.builderSetup()),
      criteria,
      {},
    )
    this.context.logger.verbose(`[QueryDriverPrisma] ${sql}`, { replacements })

    const rows = await this.db.$queryRawUnsafe(sql, ...replacements)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return rows as Record<string, any>[]
  }
}
