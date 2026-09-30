import { PrismaClient } from '@prisma/client'

import { BulkChunkLoader } from './bulk-chunk-loader'
import { ChunkLoader } from './chunk-loader'
import { PrimaryKeyMatcher } from './primary-key-matcher'
import { RecordChunker } from './record-chunker'
import { RecordComparator } from './record-comparator'
import { RowByRowChunkLoader } from './row-by-row-chunk-loader'
import { RowWriter } from './row-writer'
import { SeedTarget } from './seed-target'
import { SeederSqlBuilder } from './seeder-sql-builder'
import { SeederTableGateway } from './seeder-table-gateway'
import type { SeederOptions, Value } from './seeder-types'
import type { TableSchema } from './table-schema'
import { TimestampStamper } from './timestamp-stamper'

export type { SeederOptions } from './seeder-types'

export class Seeder {
  private readonly chunker = new RecordChunker(TimestampStamper.MAX_COLUMNS)
  private readonly chunk_loader: ChunkLoader
  private readonly gateway: SeederTableGateway
  private readonly sql_builder: SeederSqlBuilder

  constructor(
    client: PrismaClient,
    private readonly options: SeederOptions,
  ) {
    this.sql_builder = SeederSqlBuilder.fromOptions(options)
    this.gateway = new SeederTableGateway(client, this.sql_builder)
    const writer = new RowWriter(
      this.gateway,
      new RecordComparator(),
      new TimestampStamper(),
    )
    this.chunk_loader = new ChunkLoader(
      new BulkChunkLoader(this.gateway, new PrimaryKeyMatcher(), writer),
      new RowByRowChunkLoader(this.gateway, writer),
    )
  }

  async load(
    table_name: string,
    pk: string,
    columns: string[],
    records: Value[][],
    options?: Partial<SeederOptions>,
  ): Promise<void> {
    if (records.length === 0) {
      console.info(`loading "${table_name}" done.`)
      return
    }
    const target = SeedTarget.create(table_name, pk, columns, {
      ...this.options,
      ...options,
    })
    const schema = await this.schemaFor(target, records)
    const seed_target = target.withSchema(schema)
    for (const chunk of this.chunker.split(columns, records))
      await this.chunk_loader.load(seed_target, chunk)
    console.info(`loading "${table_name}" done.`)
  }

  private async schemaFor(
    target: SeedTarget,
    records: Value[][],
  ): Promise<TableSchema | null> {
    if (!this.sql_builder.readsSchema()) return null
    if (!this.needsSchema(target, records)) return null
    return this.gateway.selectSchema(target.table_name)
  }

  private needsSchema(target: SeedTarget, records: Value[][]): boolean {
    return records.some((record) => {
      const pk_value = target.pkValueOf(record)
      return pk_value === null || pk_value === undefined
    })
  }
}
