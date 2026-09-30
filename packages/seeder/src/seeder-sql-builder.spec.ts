import { describe, expect, it } from 'vitest'

import { SeederSqlBuilder } from './seeder-sql-builder'

describe('SeederSqlBuilder', () => {
  describe('fromOptions', () => {
    const placeholderOf = (
      options: Parameters<typeof SeederSqlBuilder.fromOptions>[0],
    ) => SeederSqlBuilder.fromOptions(options).selectByPk('t', 'id', 1).sql

    describe('placeholder を指定しない場合', () => {
      it('quote も未指定なら ` と ? で組み立てる', () => {
        expect(placeholderOf({})).toBe(
          'SELECT * FROM `t` WHERE `id` = ? LIMIT 1',
        )
      })

      it('quote が ` なら ? で組み立てる', () => {
        expect(placeholderOf({ quote: '`' })).toBe(
          'SELECT * FROM `t` WHERE `id` = ? LIMIT 1',
        )
      })

      it('quote が " なら $ で組み立てる', () => {
        expect(placeholderOf({ quote: '"' })).toBe(
          'SELECT * FROM "t" WHERE "id" = $1 LIMIT 1',
        )
      })

      it('quote が空なら $ で組み立てる', () => {
        expect(placeholderOf({ quote: '' })).toBe(
          'SELECT * FROM t WHERE id = $1 LIMIT 1',
        )
      })
    })

    describe('placeholder を指定した場合', () => {
      it('quote が ` でも指定した $ を使う', () => {
        expect(placeholderOf({ quote: '`', placeholder: '$' })).toBe(
          'SELECT * FROM `t` WHERE `id` = $1 LIMIT 1',
        )
      })

      it('quote が " でも指定した ? を使う', () => {
        expect(placeholderOf({ quote: '"', placeholder: '?' })).toBe(
          'SELECT * FROM "t" WHERE "id" = ? LIMIT 1',
        )
      })
    })
  })

  describe('プレースホルダーが $ の場合', () => {
    const builder = new SeederSqlBuilder('`', '$')

    describe('selectByPk', () => {
      it('主キー1件の SELECT と値を返す', () => {
        expect(builder.selectByPk('users', 'id', 7)).toEqual({
          sql: 'SELECT * FROM `users` WHERE `id` = $1 LIMIT 1',
          values: [7],
        })
      })
    })

    describe('selectByPks', () => {
      it('番号付きの IN 句を返す', () => {
        expect(builder.selectByPks('users', 'id', [1, 2, 3])).toEqual({
          sql: 'SELECT * FROM `users` WHERE `id` IN ($1, $2, $3)',
          values: [1, 2, 3],
        })
      })
    })

    describe('insert', () => {
      it('1行なら単一 VALUES の INSERT を返す', () => {
        expect(builder.insert('users', ['id', 'name'], [[1, 'a']])).toEqual({
          sql: 'INSERT INTO `users` (`id`, `name`) VALUES ($1, $2)',
          values: [1, 'a'],
        })
      })

      it('複数行なら番号を通しで振り、値を行優先で並べる', () => {
        expect(
          builder.insert(
            'users',
            ['id', 'name'],
            [
              [1, 'a'],
              [2, 'b'],
            ],
          ),
        ).toEqual({
          sql: 'INSERT INTO `users` (`id`, `name`) VALUES ($1, $2), ($3, $4)',
          values: [1, 'a', 2, 'b'],
        })
      })
    })

    describe('update', () => {
      it('SET の後ろに主キーの番号を振り、値の末尾に主キーを置く', () => {
        expect(
          builder.update('users', 'id', ['name', 'age'], ['a', 3], 9),
        ).toEqual({
          sql: 'UPDATE `users` SET `name` = $1, `age` = $2 WHERE `id` = $3',
          values: ['a', 3, 9],
        })
      })
    })
  })

  describe('プレースホルダーが ? の場合', () => {
    const builder = new SeederSqlBuilder('"', '?')

    it('select は全位置を番号なしの ? にし、引用符を指定のものにする', () => {
      expect(builder.selectByPks('users', 'id', [1, 2]).sql).toBe(
        'SELECT * FROM "users" WHERE "id" IN (?, ?)',
      )
    })

    it('insert は全位置を番号なしの ? にし、引用符を指定のものにする', () => {
      expect(
        builder.insert(
          'users',
          ['id', 'name'],
          [
            [1, 'a'],
            [2, 'b'],
          ],
        ).sql,
      ).toBe('INSERT INTO "users" ("id", "name") VALUES (?, ?), (?, ?)')
    })

    it('update は全位置を番号なしの ? にし、引用符を指定のものにする', () => {
      expect(builder.update('users', 'id', ['name'], ['a'], 1).sql).toBe(
        'UPDATE "users" SET "name" = ? WHERE "id" = ?',
      )
    })
  })

  describe('引用符が空の場合', () => {
    it('識別子を引用しない', () => {
      expect(
        new SeederSqlBuilder('', '$').selectByPk('users', 'id', 1).sql,
      ).toBe('SELECT * FROM users WHERE id = $1 LIMIT 1')
    })
  })

  describe('readsSchema', () => {
    it('placeholder が $ なら true', () => {
      expect(new SeederSqlBuilder('"', '$').readsSchema()).toBe(true)
    })

    it('placeholder が ? なら false', () => {
      expect(new SeederSqlBuilder('`', '?').readsSchema()).toBe(false)
    })
  })

  describe('columnsOf', () => {
    it('現在のスキーマのテーブルの列情報を、テーブル名を束縛して読む', () => {
      expect(new SeederSqlBuilder('"', '$').columnsOf('users')).toEqual({
        sql: 'SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $1',
        values: ['users'],
      })
    })
  })
})
