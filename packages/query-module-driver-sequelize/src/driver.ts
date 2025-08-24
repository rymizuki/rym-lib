import { QueryTypes, Sequelize } from 'sequelize'

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

  customFilter(fn: (source: any) => any): any {
    if (!this.setup) {
      throw new Error('QueryDriver must be required source.')
    }
    const source = this.setup(this.builderSetup())
    return fn(source)
  }

  async execute(
    criteria: QueryCriteriaInterface,
  ): Promise<Record<string, any>[]> {
    if (!this.setup) {
      throw new Error('QueryDriver must be required source.')
    }
    const [sql, replacements] = buildSQL(
      this.setup(this.builderSetup()),
      criteria,
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
}
