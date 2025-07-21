import { PrismaClient } from '@prisma/client'

type Value = string | number | Date | boolean

export class Seeder {
  constructor(
    private client: PrismaClient,
    private options: {
      created_at?: boolean
      updated_at?: boolean
      quote?: '`' | '"' | ''
    },
  ) {}

  async load(
    table_name: string,
    pk: string,
    columns: string[],
    records: Value[][],
  ): Promise<void> {
    for (const record of records) {
      const pk_index = columns.findIndex((prop) => prop === pk)
      if (pk_index < 0)
        throw new Error(
          `Seeder error: table(${table_name}) pk(${pk}) missing in (${columns.join(', ')})`,
        )
      const pk_value = record[pk_index]
      const row = (
        await this.client.$queryRawUnsafe(
          `SELECT * FROM ${this.escape(table_name)} WHERE ${this.escape(pk)} = $1 LIMIT 1`,
          pk_value,
        )
      )[0]

      if (row) {
        if (
          !columns.filter((prop, index) => row[prop] !== record[index]).length
        ) {
          // 対象が変更されてなかったらupdateしない
          continue
        }

        let index = 0
        const setters = columns
          .filter((prop) => prop !== pk)
          .map((prop) => `${this.escape(prop)} = $${++index}`)
        const values = columns
          .map((_, index) => (index === pk_index ? null : record[index]))
          .filter((value) => value !== null)
        if (this.options.updated_at) {
          setters.push(`${this.escape('updated_at')} = $${++index}`)
          values.push(new Date())
        }
        const sql = `UPDATE ${table_name} SET ${setters.join(', ')} WHERE ${pk} = $${++index}`
        try {
          await this.client.$executeRawUnsafe(sql, ...values, pk_value)
        } catch (error) {
          console.info({ sql, values, pk_value })
          throw error
        }
      } else {
        const cols = [...columns].map((col) => `${this.escape(col)}`)
        const values = columns.map((_, index) => record[index])
        if (this.options.created_at) {
          cols.push(this.escape('created_at'))
          values.push(new Date())
        }
        if (this.options.updated_at) {
          cols.push(this.escape('updated_at'))
          values.push(new Date())
        }
        const sql = `INSERT INTO ${this.escape(table_name)} (${cols.join(', ')}) VALUES (${cols.map((_, index) => `$${index + 1}`).join(', ')})`
        try {
          await this.client.$executeRawUnsafe(sql, ...values)
        } catch (error) {
          console.info({ sql, values })
          throw error
        }
      }
    }
    console.info(`loading "${table_name}" done.`)
  }

  private escape(value: string) {
    const quote = this.options.quote ?? '`'
    return `${quote}${value}${quote}`
  }
}
