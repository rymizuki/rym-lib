import { PrismaClient } from '@prisma/client'

type Value = string | number | bigint | Date | boolean | null

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
        Math.floor(Seeder.MAX_BIND_VALUES / (columns.length + 2)),
      ),
    )
    for (const chunk of this.chunk(records, chunk_size)) {
      const known_pk_values = chunk
        .map((record) => record[pk_index])
        .filter((pk_value) => pk_value !== null)
      const known_keys = new Set(
        known_pk_values.map((pk_value) => this.toMatchKey(pk_value)),
      )
      if (known_keys.size !== known_pk_values.length) {
        await this.loadOneByOne(
          table_name,
          pk,
          pk_index,
          columns,
          chunk,
          merged_options,
        )
        continue
      }
      const query_result =
        known_pk_values.length === 0
          ? []
          : ((await this.client.$queryRawUnsafe(
              `SELECT * FROM ${this.escape(table_name)} WHERE ${this.escape(
                pk,
              )} IN (${known_pk_values.map((_, index) => this.getPlaceholder(index)).join(', ')})`,
              ...known_pk_values,
            )) as Record<string, any>[])
      const rows = new Map(
        query_result.map((row) => [this.toMatchKey(row[pk]), row]),
      )
      if ([...rows.keys()].some((key) => !known_keys.has(key))) {
        await this.loadOneByOne(
          table_name,
          pk,
          pk_index,
          columns,
          chunk,
          merged_options,
        )
        continue
      }

      const insert_records: Value[][] = []
      const update_candidates: Value[][] = []
      for (const record of chunk) {
        const pk_value = record[pk_index]
        if (pk_value !== null && rows.has(this.toMatchKey(pk_value))) {
          update_candidates.push(record)
          continue
        }
        insert_records.push(record)
      }

      if (insert_records.length > 0) {
        try {
          await this.insertMany(
            table_name,
            columns,
            insert_records,
            merged_options,
          )
        } catch {
          await this.loadOneByOne(
            table_name,
            pk,
            pk_index,
            columns,
            chunk,
            merged_options,
          )
          continue
        }
      }

      for (const record of update_candidates) {
        if (merged_options.no_update) continue
        const row = rows.get(this.toMatchKey(record[pk_index]))
        if (
          row &&
          columns.every((prop, index) =>
            this.isEqualValue(row[prop], record[index]),
          )
        )
          continue
        await this.updateRow(
          table_name,
          pk,
          pk_index,
          columns,
          record,
          merged_options,
        )
      }
    }
    console.info(`loading "${table_name}" done.`)
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
      const pk_value = record[pk_index]
      const queryResult = (await this.client.$queryRawUnsafe(
        `SELECT * FROM ${this.escape(table_name)} WHERE ${this.escape(
          pk,
        )} = ${this.getPlaceholder(0)} LIMIT 1`,
        pk_value,
      )) as Record<string, any>[]
      const row = queryResult[0] as Record<string, any> | undefined

      if (!row) {
        await this.insertOne(table_name, columns, record, merged_options)
        continue
      }
      if (merged_options.no_update) continue
      if (
        columns.every((prop, index) =>
          this.isEqualValue(row[prop], record[index]),
        )
      )
        continue
      await this.updateRow(
        table_name,
        pk,
        pk_index,
        columns,
        record,
        merged_options,
      )
    }
  }

  private async updateRow(
    table_name: string,
    pk: string,
    pk_index: number,
    columns: string[],
    record: Value[],
    merged_options: SeederOptions,
  ): Promise<void> {
    const pk_value = record[pk_index]
    let index = 0
    const setters = columns
      .filter((prop) => prop !== pk)
      .map((prop) => `${this.escape(prop)} = ${this.getPlaceholder(index++)}`)
    const values = columns.flatMap((_, index) =>
      index === pk_index ? [] : [record[index]],
    )
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
  }

  private async insertOne(
    table_name: string,
    columns: string[],
    record: Value[],
    merged_options: SeederOptions,
  ): Promise<void> {
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

  private async insertMany(
    table_name: string,
    columns: string[],
    records: Value[][],
    merged_options: SeederOptions,
  ): Promise<void> {
    const cols = columns.map((col) => this.escape(col))
    const now = new Date()
    const extra_values: Value[] = []
    if (merged_options.created_at) {
      cols.push(this.escape('created_at'))
      extra_values.push(now)
    }
    if (merged_options.updated_at) {
      cols.push(this.escape('updated_at'))
      extra_values.push(now)
    }
    const values = records.flatMap((record) => [
      ...columns.map((_, index) => record[index]),
      ...extra_values,
    ])
    const row_placeholders = records.map((_, row_index) => {
      const placeholders = cols.map((_, col_index) =>
        this.getPlaceholder(row_index * cols.length + col_index),
      )
      return `(${placeholders.join(', ')})`
    })
    const sql = `INSERT INTO ${this.escape(table_name)} (${cols.join(
      ', ',
    )}) VALUES ${row_placeholders.join(', ')}`
    await this.client.$executeRawUnsafe(sql, ...values)
  }

  private chunk<T>(items: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
      items.slice(index * size, (index + 1) * size),
    )
  }

  private toMatchKey(value: unknown): string {
    if (value instanceof Date) return value.toISOString()
    if (typeof value === 'string') return value
    return String(value)
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
