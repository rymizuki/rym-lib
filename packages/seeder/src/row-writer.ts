import type { RecordComparator } from './record-comparator'
import type { SeedTarget } from './seed-target'
import type { SeederTableGateway } from './seeder-table-gateway'
import type { Row, Value } from './seeder-types'
import type { TimestampStamper } from './timestamp-stamper'

type PrimaryKeyRun = { omits_pk: boolean; records: Value[][] }

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
    for (const run of this.splitByPrimaryKeyOmission(target, records)) {
      const insert_target = run.omits_pk
        ? target.withoutPrimaryKeyColumn()
        : target
      const { columns, rows } = this.stamper.stampInsert(
        insert_target,
        run.records,
      )
      await this.gateway.insertMany(
        target.table_name,
        columns,
        rows,
        run.records.map((record) => target.pkValueOf(record)),
      )
    }
  }

  async insertOne(target: SeedTarget, record: Value[]): Promise<void> {
    const insert_target = target.omitsPrimaryKeyOf(record)
      ? target.withoutPrimaryKeyColumn()
      : target
    await this.gateway.insertOne(
      target.table_name,
      this.stamper.insertColumns(insert_target),
      this.stamper.stampInsertRow(insert_target, record, new Date()),
    )
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

  private splitByPrimaryKeyOmission(
    target: SeedTarget,
    records: Value[][],
  ): PrimaryKeyRun[] {
    return records.reduce<PrimaryKeyRun[]>((runs, record) => {
      const omits_pk = target.omitsPrimaryKeyOf(record)
      const last = runs[runs.length - 1]
      if (last?.omits_pk === omits_pk)
        return [
          ...runs.slice(0, -1),
          { omits_pk, records: [...last.records, record] },
        ]
      return [...runs, { omits_pk, records: [record] }]
    }, [])
  }
}
