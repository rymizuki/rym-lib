import type { BindValue, Statement, Value } from './seeder-types'

export class SeederSqlBuilder {
  constructor(
    private readonly quote_char: '`' | '"' | '',
    private readonly placeholder_char: '$' | '?',
  ) {}

  selectByPk(
    table: string,
    pk: string,
    pk_value: Value | undefined,
  ): Statement {
    return {
      sql: `SELECT * FROM ${this.quote(table)} WHERE ${this.quote(pk)} = ${this.placeholder(0)} LIMIT 1`,
      values: [pk_value],
    }
  }

  selectByPks(table: string, pk: string, pk_values: Value[]): Statement {
    const placeholders = pk_values.map((_, index) => this.placeholder(index))
    return {
      sql: `SELECT * FROM ${this.quote(table)} WHERE ${this.quote(pk)} IN (${placeholders.join(', ')})`,
      values: pk_values,
    }
  }

  insert(table: string, columns: string[], rows: BindValue[][]): Statement {
    const quoted_columns = columns.map((column) => this.quote(column))
    const row_placeholders = rows.map((_, row_index) => {
      const placeholders = columns.map((_, column_index) =>
        this.placeholder(row_index * columns.length + column_index),
      )
      return `(${placeholders.join(', ')})`
    })
    return {
      sql: `INSERT INTO ${this.quote(table)} (${quoted_columns.join(', ')}) VALUES ${row_placeholders.join(', ')}`,
      values: rows.flat(),
    }
  }

  update(
    table: string,
    pk: string,
    set_columns: string[],
    set_values: BindValue[],
    pk_value: Value | undefined,
  ): Statement {
    const setters = set_columns.map(
      (column, index) => `${this.quote(column)} = ${this.placeholder(index)}`,
    )
    return {
      sql: `UPDATE ${this.quote(table)} SET ${setters.join(', ')} WHERE ${this.quote(pk)} = ${this.placeholder(set_columns.length)}`,
      values: [...set_values, pk_value],
    }
  }

  private quote(identifier: string): string {
    return `${this.quote_char}${identifier}${this.quote_char}`
  }

  private placeholder(index: number): string {
    if (this.placeholder_char === '?') return '?'
    return `${this.placeholder_char}${index + 1}`
  }
}
