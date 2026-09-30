import { describe, expect, it } from 'vitest'

import { SeedTarget } from './seed-target'
import { TableSchema } from './table-schema'

describe('SeedTarget', () => {
  describe('create', () => {
    describe('pk が columns に無い場合', () => {
      it('テーブル名・pk・列を含む文言で throw する', () => {
        expect(() =>
          SeedTarget.create('users', 'id', ['name', 'age'], {}),
        ).toThrow('Seeder error: table(users) pk(id) missing in (name, age)')
      })
    })

    describe('pk が columns にある場合', () => {
      it('pk の位置を pk_index に持つ', () => {
        const target = SeedTarget.create('users', 'id', ['name', 'id'], {})
        expect(target.pk_index).toBe(1)
      })
    })
  })

  describe('pkValueOf', () => {
    const target = SeedTarget.create('users', 'id', ['name', 'id'], {})

    it('record の pk 位置の値を返す', () => {
      expect(target.pkValueOf(['taro', 7])).toBe(7)
    })

    it('record が列より短ければ undefined を返す', () => {
      expect(target.pkValueOf(['taro'])).toBeUndefined()
    })
  })

  describe('omitsPrimaryKeyOf', () => {
    const schema = new TableSchema([
      { name: 'id', data_type: 'integer', is_nullable: false },
      { name: 'name', data_type: 'text', is_nullable: true },
    ])
    const target = SeedTarget.create('users', 'id', ['id', 'name'], {})

    it('schema があり pk が NOT NULL で、pk の値が null なら true', () => {
      expect(target.withSchema(schema).omitsPrimaryKeyOf([null, 'a'])).toBe(
        true,
      )
    })

    it('record が pk の位置に届かず undefined でも true', () => {
      expect(target.withSchema(schema).omitsPrimaryKeyOf([])).toBe(true)
    })

    it('pk の値があれば false', () => {
      expect(target.withSchema(schema).omitsPrimaryKeyOf([1, 'a'])).toBe(false)
    })

    it('schema が無ければ false', () => {
      expect(target.omitsPrimaryKeyOf([null, 'a'])).toBe(false)
    })

    it('pk が NULL 可なら false', () => {
      const nullable = new TableSchema([
        { name: 'id', data_type: 'integer', is_nullable: true },
      ])
      expect(target.withSchema(nullable).omitsPrimaryKeyOf([null, 'a'])).toBe(
        false,
      )
    })
  })

  describe('withoutPrimaryKeyColumn', () => {
    const target = SeedTarget.create(
      'users',
      'id',
      ['name', 'id', 'age'],
      {},
    ).withoutPrimaryKeyColumn()

    it('pk を除いた列を持つ', () => {
      expect(target.columns).toEqual(['name', 'age'])
    })

    it('record から pk の位置を除いた値を返す', () => {
      expect(target.insertValuesOf(['taro', null, 20])).toEqual(['taro', 20])
    })
  })
})
