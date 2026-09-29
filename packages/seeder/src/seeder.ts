import { PrismaClient } from '@prisma/client'

import { PrimaryKeyMatcher } from './primary-key-matcher'
import { RecordComparator } from './record-comparator'
import { SeederSqlBuilder } from './seeder-sql-builder'
import { SeederTableGateway } from './seeder-table-gateway'
import type { Row, Value } from './seeder-types'

export type SeederOptions = {
  created_at?: boolean
  updated_at?: boolean
  quote?: '`' | '"' | ''
  placeholder?: '$' | '?'
  no_update?: boolean
}

export class Seeder {
  private static readonly DEFAULT_CHUNK_SIZE = 500
  private static readonly MAX_BIND_VALUES = 32767
  private static readonly TIMESTAMP_COLUMNS = [
    'created_at',
    'updated_at',
  ] as const

  private readonly gateway: SeederTableGateway
  private readonly matcher = new PrimaryKeyMatcher()
  private readonly comparator = new RecordComparator()

  constructor(
    client: PrismaClient,
    private options: SeederOptions,
  ) {
    this.gateway = new SeederTableGateway(
      client,
      new SeederSqlBuilder(options.quote ?? '`', options.placeholder || '$'),
    )
  }

  async load(
    table_name: string,
    pk: string,
    columns: string[],
    records: Value[][],
    options?: Partial<SeederOptions>,
  ): Promise<void> {
    const merged_options = { ...this.options, ...options }
    if (records.length === 0) {
      console.info(`loading "${table_name}" done.`)
      return
    }
    const pk_index = columns.findIndex((prop) => prop === pk)
    if (pk_index < 0)
      throw new Error(
        `Seeder error: table(${table_name}) pk(${pk}) missing in (${columns.join(
          ', ',
        )})`,
      )
    const chunk_size = Math.max(
      1,
      Math.min(
        Seeder.DEFAULT_CHUNK_SIZE,
        Math.floor(
          Seeder.MAX_BIND_VALUES /
            (columns.length + Seeder.TIMESTAMP_COLUMNS.length),
        ),
      ),
    )
    for (const chunk of this.chunk(records, chunk_size)) {
      const loaded = await this.loadChunkInBulk(
        table_name,
        pk,
        pk_index,
        columns,
        chunk,
        merged_options,
      )
      if (loaded) continue
      await this.loadOneByOne(
        table_name,
        pk,
        pk_index,
        columns,
        chunk,
        merged_options,
      )
    }
    console.info(`loading "${table_name}" done.`)
  }

  private async loadChunkInBulk(
    table_name: string,
    pk: string,
    pk_index: number,
    columns: string[],
    chunk: Value[][],
    merged_options: SeederOptions,
  ): Promise<boolean> {
    const existing_rows = await this.findRowsMatchedByPk(
      table_name,
      pk,
      pk_index,
      chunk,
    )
    if (!existing_rows) return false

    const insert_records = chunk.filter(
      (record) => !this.matcher.find(existing_rows, record[pk_index]),
    )
    if (insert_records.length > 0) {
      await this.gateway.insertMany(
        table_name,
        [...columns, ...this.timestampColumns(merged_options)],
        this.withTimestamps(insert_records, merged_options),
        insert_records.map((record) => record[pk_index]),
      )
    }

    for (const record of chunk) {
      const row = this.matcher.find(existing_rows, record[pk_index])
      if (!row) continue
      await this.updateRowIfChanged(
        table_name,
        pk,
        pk_index,
        columns,
        record,
        row,
        merged_options,
      )
    }
    return true
  }

  private async findRowsMatchedByPk(
    table_name: string,
    pk: string,
    pk_index: number,
    chunk: Value[][],
  ): Promise<Map<string, Row> | null> {
    const pk_values = this.matcher.bulkQueryableValues(
      chunk.map((record) => record[pk_index]),
    )
    if (!pk_values) return null
    const rows =
      pk_values.length === 0
        ? []
        : await this.gateway.selectMany(table_name, pk, pk_values)
    return this.matcher.indexRows(pk, rows, pk_values)
  }

  private async loadOneByOne(
    table_name: string,
    pk: string,
    pk_index: number,
    columns: string[],
    records: Value[][],
    merged_options: SeederOptions,
  ): Promise<void> {
    for (const record of records) {
      const row = await this.gateway.selectOne(table_name, pk, record[pk_index])
      if (!row) {
        await this.gateway.insertOne(
          table_name,
          [...columns, ...this.timestampColumns(merged_options)],
          this.withTimestamp(record, merged_options, new Date()),
        )
        continue
      }
      await this.updateRowIfChanged(
        table_name,
        pk,
        pk_index,
        columns,
        record,
        row,
        merged_options,
      )
    }
  }

  private async updateRowIfChanged(
    table_name: string,
    pk: string,
    pk_index: number,
    columns: string[],
    record: Value[],
    row: Row,
    merged_options: SeederOptions,
  ): Promise<void> {
    if (merged_options.no_update) return
    if (this.comparator.isSameRow(row, columns, record)) return
    const set_columns = columns.filter((prop) => prop !== pk)
    const set_values = record.filter((_, index) => index !== pk_index)
    if (merged_options.updated_at) {
      set_columns.push('updated_at')
      set_values.push(new Date())
    }
    await this.gateway.update(
      table_name,
      pk,
      set_columns,
      set_values,
      record[pk_index],
    )
  }

  private timestampColumns(merged_options: SeederOptions): string[] {
    return Seeder.TIMESTAMP_COLUMNS.filter((column) => merged_options[column])
  }

  private withTimestamps(
    records: Value[][],
    merged_options: SeederOptions,
  ): Value[][] {
    const now = new Date()
    return records.map((record) =>
      this.withTimestamp(record, merged_options, now),
    )
  }

  private withTimestamp(
    record: Value[],
    merged_options: SeederOptions,
    now: Date,
  ): Value[] {
    return [...record, ...this.timestampColumns(merged_options).map(() => now)]
  }

  private chunk<T>(items: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
      items.slice(index * size, (index + 1) * size),
    )
  }
}
