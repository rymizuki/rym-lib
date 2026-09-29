import { PrismaClient } from '@prisma/client'

import type { SeederSqlBuilder } from './seeder-sql-builder'
import type { BindValue, Row, Value } from './seeder-types'

export class SeederTableGateway {
  constructor(
    private readonly client: PrismaClient,
    private readonly sql_builder: SeederSqlBuilder,
  ) {}

  async selectOne(
    table: string,
    pk: string,
    pk_value: Value | undefined,
  ): Promise<Row | undefined> {
    const { sql, values } = this.sql_builder.selectByPk(table, pk, pk_value)
    const rows = (await this.client.$queryRawUnsafe(sql, ...values)) as Row[]
    return rows[0]
  }

  async selectMany(
    table: string,
    pk: string,
    pk_values: Value[],
  ): Promise<Row[]> {
    const { sql, values } = this.sql_builder.selectByPks(table, pk, pk_values)
    return (await this.client.$queryRawUnsafe(sql, ...values)) as Row[]
  }

  async insertOne(
    table: string,
    columns: string[],
    record: BindValue[],
  ): Promise<void> {
    const { sql, values } = this.sql_builder.insert(table, columns, [record])
    try {
      await this.client.$executeRawUnsafe(sql, ...values)
    } catch (error) {
      console.info({ sql, values })
      throw error
    }
  }

  async insertMany(
    table: string,
    columns: string[],
    records: BindValue[][],
    pk_values: (Value | undefined)[],
  ): Promise<void> {
    const { sql, values } = this.sql_builder.insert(table, columns, records)
    try {
      await this.client.$executeRawUnsafe(sql, ...values)
    } catch (error) {
      console.info({
        table_name: table,
        row_count: records.length,
        pk_values,
      })
      throw error
    }
  }

  async update(
    table: string,
    pk: string,
    set_columns: string[],
    set_values: BindValue[],
    pk_value: Value | undefined,
  ): Promise<void> {
    const { sql, values } = this.sql_builder.update(
      table,
      pk,
      set_columns,
      set_values,
      pk_value,
    )
    try {
      await this.client.$executeRawUnsafe(sql, ...values)
    } catch (error) {
      console.info({ sql, values: set_values, pk_value })
      throw error
    }
  }
}
