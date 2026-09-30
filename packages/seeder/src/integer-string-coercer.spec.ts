import { describe, expect, it } from 'vitest'

import { IntegerStringCoercer } from './integer-string-coercer'
import { SeedTarget } from './seed-target'
import type { Value } from './seeder-types'
import { TableSchema } from './table-schema'

describe('IntegerStringCoercer', () => {
  const coercer = new IntegerStringCoercer()
  const target = SeedTarget.create('t', 'id', ['id', 'name', 'price'], {})
  const schema = new TableSchema([
    { name: 'id', data_type: 'bigint', is_nullable: false },
    { name: 'name', data_type: 'text', is_nullable: true },
    { name: 'price', data_type: 'numeric', is_nullable: true },
  ])

  describe('coerce', () => {
    describe('整数型の列に数字の文字列がある場合', () => {
      it('bigint に置き換える', () => {
        expect(coercer.coerce(target, [['10', 'a', 'x']], schema)).toEqual([
          [10n, 'a', 'x'],
        ])
      })

      it('負数も置き換える', () => {
        expect(coercer.coerce(target, [['-3', 'a', 'x']], schema)).toEqual([
          [-3n, 'a', 'x'],
        ])
      })

      it('number の精度を超える値も丸めずに置き換える', () => {
        expect(
          coercer.coerce(target, [['9007199254740993', 'a', 'x']], schema),
        ).toEqual([[9007199254740993n, 'a', 'x']])
      })
    })

    describe('整数型の列に数字の文字列でない値がある場合', () => {
      it.each<[string, Value]>([
        ['小数', '1.5'],
        ['英字混じり', '12a'],
        ['空文字', ''],
        ['number', 7],
        ['null', null],
      ])('%s はそのまま残す', (_, value) => {
        expect(coercer.coerce(target, [[value, 'a', 'x']], schema)).toEqual([
          [value, 'a', 'x'],
        ])
      })
    })

    describe('整数型でない列に数字の文字列がある場合', () => {
      it('そのまま残す', () => {
        expect(coercer.coerce(target, [[1, '20', '30']], schema)).toEqual([
          [1, '20', '30'],
        ])
      })
    })

    it('元の配列を変更しない', () => {
      const records: Value[][] = [['10', 'a', 'x']]
      coercer.coerce(target, records, schema)
      expect(records).toEqual([['10', 'a', 'x']])
    })
  })

  describe('includesIntegerString', () => {
    it('数字の文字列があれば true', () => {
      expect(
        coercer.includesIntegerString([
          [1, 'a'],
          ['2', 'b'],
        ]),
      ).toBe(true)
    })

    it('数字の文字列が無ければ false', () => {
      expect(
        coercer.includesIntegerString([
          [1, 'a'],
          [null, '1.5'],
        ]),
      ).toBe(false)
    })
  })
})
