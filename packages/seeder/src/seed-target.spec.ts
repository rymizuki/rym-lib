import { describe, expect, it } from 'vitest'

import { SeedTarget } from './seed-target'

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
})
