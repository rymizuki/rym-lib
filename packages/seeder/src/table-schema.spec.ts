import { describe, expect, it } from 'vitest'

import { TableSchema } from './table-schema'

describe('TableSchema', () => {
  const schema = new TableSchema([
    { name: 'id', data_type: 'integer', is_nullable: false },
    { name: 'amount', data_type: 'bigint', is_nullable: true },
    { name: 'rank', data_type: 'smallint', is_nullable: true },
    { name: 'price', data_type: 'numeric', is_nullable: true },
    { name: 'name', data_type: 'text', is_nullable: false },
  ])

  describe('isIntegerColumn', () => {
    it.each(['id', 'amount', 'rank'])('%s は整数型の列', (name) => {
      expect(schema.isIntegerColumn(name)).toBe(true)
    })

    it.each(['price', 'name', 'missing'])('%s は整数型の列ではない', (name) => {
      expect(schema.isIntegerColumn(name)).toBe(false)
    })
  })

  describe('isNotNull', () => {
    it.each(['id', 'name'])('%s は NOT NULL', (name) => {
      expect(schema.isNotNull(name)).toBe(true)
    })

    it('NULL 可の列は NOT NULL ではない', () => {
      expect(schema.isNotNull('amount')).toBe(false)
    })

    it('列が見つからなければ NOT NULL ではない', () => {
      expect(schema.isNotNull('missing')).toBe(false)
    })
  })
})
