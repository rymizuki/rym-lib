import type { RecordComparator } from './record-comparator'
import type { SeedTarget } from './seed-target'
import type { SeederTableGateway } from './seeder-table-gateway'
import type { Row, Value } from './seeder-types'
import type { TimestampStamper } from './timestamp-stamper'

/**
 * 日時列を付与したうえで、行の INSERT / UPDATE をゲートウェイへ発行する。
 */
export class RowWriter {
  constructor(
    private readonly gateway: SeederTableGateway,
    private readonly comparator: RecordComparator,
    private readonly stamper: TimestampStamper,
  ) {}

  async insertMany(target: SeedTarget, records: Value[][]): Promise<void> {
    if (records.length === 0) return
    const { columns, rows } = this.stamper.stampInsert(target, records)
    await this.gateway.insertMany(
      target.table_name,
      columns,
      rows,
      records.map((record) => target.pkValueOf(record)),
    )
  }

  async insertOne(target: SeedTarget, record: Value[]): Promise<void> {
    const { columns, rows } = this.stamper.stampInsert(target, [record])
    const [row] = rows
    if (!row) return
    await this.gateway.insertOne(target.table_name, columns, row)
  }

  async updateIfChanged(
    target: SeedTarget,
    record: Value[],
    row: Row,
  ): Promise<void> {
    if (target.options.no_update) return
    if (this.comparator.isSameRow(row, target.columns, record)) return
    const { columns, values } = this.stamper.stampUpdate(target, record)
    await this.gateway.update(
      target.table_name,
      target.pk,
      columns,
      values,
      target.pkValueOf(record),
    )
  }
}
