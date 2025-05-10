import { PrismaClient } from '@prisma/client'
import {
  QueryCriteriaInterface,
  QueryDriverInterface,
  QueryLoggerInterface,
} from '@rym-lib/query-module'
import {
  buildSQL,
  createBuilder,
  SQLBuilderPort,
} from '@rym-lib/query-module-sql-builder'

export class QueryDriverPrisma implements QueryDriverInterface {
  private setup: ((builder: SQLBuilderPort) => SQLBuilderPort) | null = null

  constructor(
    private db: PrismaClient,
    private context: {
      logger: QueryLoggerInterface
    },
  ) {}

  source(setup: (builder: SQLBuilderPort) => SQLBuilderPort): this {
    this.setup = setup
    return this
  }

  async execute<D>(criteria: QueryCriteriaInterface<D>): Promise<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Record<string, any>[]
  > {
    if (!this.setup) {
      throw new Error('QueryDriver must be required source.')
    }

    const [sql, replacements] = buildSQL(this.setup(createBuilder()), criteria)
    this.context.logger.verbose(`[QueryDriverPrisma] ${sql}`, { replacements })

    const rows = await this.db.$queryRawUnsafe(sql, ...replacements)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return rows as Record<string, any>[]
  }
}
