import { QueryTypes, Sequelize } from 'sequelize'

import {
  QueryCriteriaInterface,
  QueryDriverInterface,
  QueryLoggerInterface,
} from '@rym-lib/query-module'
import {
  buildSQL,
  createBuilder,
  CustomFilterFunction,
  SQLBuilderPort,
} from '@rym-lib/query-module-sql-builder'

export class QueryDriverSequelize implements QueryDriverInterface {
  private setup: ((builder: SQLBuilderPort) => SQLBuilderPort) | null = null
  private builderSetup: () => SQLBuilderPort

  constructor(
    private db: Sequelize,
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

  async execute(
    criteria: QueryCriteriaInterface,
  ): Promise<Record<string, any>[]> {
    if (!this.setup) {
      throw new Error('QueryDriver must be required source.')
    }

    const builder = this
    const [sql, replacements] = buildSQL(
      this.setup(this.builderSetup()),
      criteria,
      {
        builder: this.builderSetup(),
        customFilter: this.customFilter,
      },
    )
    this.context.logger.verbose(`[QueryDriverSequelize] ${sql}`, {
      sql,
      replacements,
    })

    const rows = await this.db.query(sql, {
      replacements,
      type: QueryTypes.SELECT,
    })
    return rows as Record<string, any>[]
  }

  customFilter: CustomFilterFunction = (content, context, fn) => {
    return fn(content, context)
  }
}
