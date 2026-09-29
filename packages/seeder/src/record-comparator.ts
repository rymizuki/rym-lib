import type { Row, Value } from './seeder-types'

export class RecordComparator {
  isSameRow(row: Row, columns: string[], record: Value[]): boolean {
    return columns.every((column, index) =>
      this.isEqualValue(row[column], record[index]),
    )
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
}
