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
import { TimestampStamper } from './timestamp-stamper'

export type { SeederOptions } from './seeder-types'

export class Seeder {
  private readonly chunker = new RecordChunker(TimestampStamper.MAX_COLUMNS)
  private readonly chunk_loader: ChunkLoader

  constructor(
    client: PrismaClient,
    private readonly options: SeederOptions,
  ) {
    const gateway = new SeederTableGateway(
      client,
      SeederSqlBuilder.fromOptions(options),
    )
    const writer = new RowWriter(
      gateway,
      new RecordComparator(),
      new TimestampStamper(),
    )
    this.chunk_loader = new ChunkLoader(
      new BulkChunkLoader(gateway, new PrimaryKeyMatcher(), writer),
      new RowByRowChunkLoader(gateway, writer),
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
    for (const chunk of this.chunker.split(columns, records))
      await this.chunk_loader.load(target, chunk)
    console.info(`loading "${table_name}" done.`)
  }
}
