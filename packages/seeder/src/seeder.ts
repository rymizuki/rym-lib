import { PrismaClient } from '@prisma/client'

type Value = string | number | bigint | Date | boolean

export type SeederOptions = {
  created_at?: boolean
  updated_at?: boolean
  quote?: '`' | '"' | ''
  placeholder?: '$' | '?'
  no_update?: boolean
}

export class Seeder {
  constructor(
    private client: PrismaClient,
    private options: SeederOptions,
  ) {}

  async load(
    table_name: string,
    pk: string,
    columns: string[],
    records: Value[][],
    options?: Partial<SeederOptions>,
  ): Promise<void> {
    const merged_options = { ...this.options, ...options }
    for (const record of records) {
      const pk_index = columns.findIndex((prop) => prop === pk)
      if (pk_index < 0)
        throw new Error(
          `Seeder error: table(${table_name}) pk(${pk}) missing in (${columns.join(
            ', ',
          )})`,
        )
      const pk_value = record[pk_index]
      const queryResult = (await this.client.$queryRawUnsafe(
        `SELECT * FROM ${this.escape(table_name)} WHERE ${this.escape(
          pk,
        )} = ${this.getPlaceholder(0)} LIMIT 1`,
        pk_value,
      )) as Record<string, any>[]
      const row = queryResult[0] as Record<string, any> | undefined

      if (row) {
        if (merged_options.no_update) {
          // no_updateオプションが指定されている場合はスキップ
          continue
        }
        if (
          columns.every((prop, index) =>
            this.isEqualValue(row[prop], record[index]),
          )
        ) {
          // 対象が変更されてなかったらupdateしない
          continue
        }

        let index = 0
        const setters = columns
          .filter((prop) => prop !== pk)
          .map(
            (prop) => `${this.escape(prop)} = ${this.getPlaceholder(index++)}`,
          )
        const values = columns
          .map((_, index) => (index === pk_index ? null : record[index]))
          .filter((value) => value !== null)
        if (merged_options.updated_at) {
          setters.push(
            `${this.escape('updated_at')} = ${this.getPlaceholder(index++)}`,
          )
          values.push(new Date())
        }
        const sql = `UPDATE ${this.escape(table_name)} SET ${setters.join(
          ', ',
        )} WHERE ${this.escape(pk)} = ${this.getPlaceholder(index++)}`
        try {
          await this.client.$executeRawUnsafe(sql, ...values, pk_value)
        } catch (error) {
          console.info({ sql, values, pk_value })
          throw error
        }
      } else {
        const cols = [...columns].map((col) => `${this.escape(col)}`)
        const values = columns.map((_, index) => record[index])
        if (merged_options.created_at) {
          cols.push(this.escape('created_at'))
          values.push(new Date())
        }
        if (merged_options.updated_at) {
          cols.push(this.escape('updated_at'))
          values.push(new Date())
        }
        const sql = `INSERT INTO ${this.escape(table_name)} (${cols.join(
          ', ',
        )}) VALUES (${cols.map((_, index) => this.getPlaceholder(index)).join(', ')})`
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

  /**
   * DBから取得した値とシード対象の値が等価かどうかを判定する。
   * どちらか一方がbigintの場合のみ数値として正規化して比較し、Date同士は日時として比較する。
   * bigintが関与しないnumber同士・string同士の比較は`===`に委ねる（ゼロ埋め文字列の誤同一視を避けるため）。
   */
  private isEqualValue(a: unknown, b: unknown): boolean {
    if (typeof a === 'bigint' || typeof b === 'bigint') {
      return this.isNumericConvertible(a) && this.isNumericConvertible(b)
        ? BigInt(a) === BigInt(b)
        : a === b
    }
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime()
    }
    return a === b
  }

  /**
   * BigIntへ変換可能な値かどうかを判定する型ガード。
   * 数値・bigintに加え、整数のみからなる文字列を対象とする。
   *
   * NOTE: number型は`Number.MAX_SAFE_INTEGER`（2^53 - 1）以下でのみ正確に比較できる。
   * それを超える値（Snowflake ID等）はnumberでは精度が失われるため、bigintまたは文字列で渡すこと。
   */
  private isNumericConvertible(
    value: unknown,
  ): value is string | number | bigint {
    if (typeof value === 'bigint') {
      return true
    }
    if (typeof value === 'number') {
      return Number.isInteger(value)
    }
    if (typeof value === 'string') {
      return /^-?\d+$/.test(value)
    }
    return false
  }

  private escape(value: string) {
    const quote = this.options.quote ?? '`'
    return `${quote}${value}${quote}`
  }

  private getPlaceholder(index: number): string {
    const placeholder = this.options.placeholder || '$'
    if (placeholder === '?') {
      return '?'
    }
    return `${placeholder}${index + 1}`
  }
}
