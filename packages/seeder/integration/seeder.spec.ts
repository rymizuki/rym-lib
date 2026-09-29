import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import { dialects } from './dialects'
import { SeederDatabase } from './seeder-database'

const OLD_DATE = '2000-01-01 00:00:00'
const OLD_TIME = new Date('2000-01-01T00:00:00.000Z').getTime()

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

type ItemRow = {
  id: number
  name: string
  created_at: Date | null
  updated_at: Date | null
}

describe.each(dialects)('Seeder.load ($name)', (dialect) => {
  const database = new SeederDatabase(dialect)
  const seeder = database.createSeeder()

  beforeAll(() => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined)
  })

  beforeEach(async () => {
    await database.reset()
  })

  afterAll(async () => {
    await database.disconnect()
  })

  const selectItems = () =>
    database.select<ItemRow>('SELECT * FROM items ORDER BY id')

  describe('空テーブルに 3 行を読み込む場合', () => {
    const records = [
      [1, 'a'],
      [2, 'b'],
      [3, 'c'],
    ]

    it('3 行が入る', async () => {
      await seeder.load('items', 'id', ['id', 'name'], records)

      const rows = await selectItems()
      expect(rows.map((row) => [row.id, row.name])).toEqual(records)
    })

    it('同じ入力をもう一度読み込んでも updated_at が変わらない', async () => {
      const options = { updated_at: true }
      await seeder.load('items', 'id', ['id', 'name'], records, options)
      const before = await selectItems()
      await sleep(30)

      await seeder.load('items', 'id', ['id', 'name'], records, options)

      const after = await selectItems()
      expect(after).toEqual(before)
    })
  })

  describe('等価な行・差分のある行・新規行が混在する場合', () => {
    beforeEach(async () => {
      await database.execute(
        `INSERT INTO items (id, name, updated_at) VALUES (1, 'same', '${OLD_DATE}'), (2, 'before', '${OLD_DATE}')`,
      )
    })

    it('差分のある行だけ値が変わり、新規行が入る', async () => {
      await seeder.load(
        'items',
        'id',
        ['id', 'name'],
        [
          [1, 'same'],
          [2, 'after'],
          [3, 'new'],
        ],
        { updated_at: true },
      )

      const rows = await selectItems()
      expect(rows.map((row) => [row.id, row.name])).toEqual([
        [1, 'same'],
        [2, 'after'],
        [3, 'new'],
      ])
    })

    it('等価な行の updated_at は変わらず、差分のある行の updated_at は更新される', async () => {
      await seeder.load(
        'items',
        'id',
        ['id', 'name'],
        [
          [1, 'same'],
          [2, 'after'],
          [3, 'new'],
        ],
        { updated_at: true },
      )

      const rows = await selectItems()
      expect(rows[0].updated_at?.getTime()).toBe(OLD_TIME)
      expect(rows[1].updated_at?.getTime()).toBeGreaterThan(OLD_TIME)
    })
  })

  describe('501 行（チャンク境界）を読み込む場合', () => {
    const records = Array.from({ length: 501 }, (_, index) => [
      index + 1,
      `name-${index + 1}`,
    ])

    it('501 行が入る', async () => {
      await seeder.load('items', 'id', ['id', 'name'], records)

      const rows = await selectItems()
      expect(rows).toHaveLength(501)
      expect(rows.map((row) => [row.id, row.name])).toEqual(records)
    })

    it('もう一度読み込んでも件数・値・updated_at が変わらない', async () => {
      const options = { updated_at: true }
      await seeder.load('items', 'id', ['id', 'name'], records, options)
      const before = await selectItems()
      await sleep(30)

      await seeder.load('items', 'id', ['id', 'name'], records, options)

      expect(await selectItems()).toEqual(before)
    })
  })

  describe('bigint の主キー・列が既存行と同じ値の場合', () => {
    beforeEach(async () => {
      await database.execute(
        `INSERT INTO big_items (id, amount, updated_at) VALUES (1, 100, '${OLD_DATE}')`,
      )
    })

    const selectBigItems = () =>
      database.select<{ id: bigint; amount: bigint; updated_at: Date }>(
        'SELECT id, amount, updated_at FROM big_items ORDER BY id',
      )

    it('number で渡しても更新されない', async () => {
      await seeder.load('big_items', 'id', ['id', 'amount'], [[1, 100]], {
        updated_at: true,
      })

      const rows = await selectBigItems()
      expect(rows.map((row) => row.updated_at.getTime())).toEqual([OLD_TIME])
    })

    if (dialect.name === 'postgres')
      it.todo(
        '数字文字列で渡しても更新されない（PostgreSQL は "bigint = text" で SELECT が失敗する。要確認）',
      )
    else {
      it('数字文字列で渡しても更新されない', async () => {
        await database.execute(
          `INSERT INTO big_items (id, amount, updated_at) VALUES (9007199254740993, 9007199254740995, '${OLD_DATE}')`,
        )

        await seeder.load(
          'big_items',
          'id',
          ['id', 'amount'],
          [
            ['1', '100'],
            ['9007199254740993', '9007199254740995'],
          ],
          { updated_at: true },
        )

        const rows = await selectBigItems()
        expect(rows.map((row) => row.updated_at.getTime())).toEqual([
          OLD_TIME,
          OLD_TIME,
        ])
      })
    }

    it('値が違えば更新される', async () => {
      await seeder.load('big_items', 'id', ['id', 'amount'], [[1, 101]], {
        updated_at: true,
      })

      const rows = await selectBigItems()
      expect(rows.map((row) => Number(row.amount))).toEqual([101])
    })
  })

  describe('日時列を読み込む場合', () => {
    beforeEach(async () => {
      await database.execute(
        `INSERT INTO events (id, occurred_at, updated_at) VALUES (1, '2024-05-06 07:08:09.123', '${OLD_DATE}')`,
      )
    })

    const selectEvent = async () =>
      (
        await database.select<{ occurred_at: Date; updated_at: Date }>(
          'SELECT occurred_at, updated_at FROM events WHERE id = 1',
        )
      )[0]

    it('既存と同じ Date なら更新されない', async () => {
      await seeder.load(
        'events',
        'id',
        ['id', 'occurred_at'],
        [[1, new Date('2024-05-06T07:08:09.123Z')]],
        { updated_at: true },
      )

      expect((await selectEvent()).updated_at.getTime()).toBe(OLD_TIME)
    })

    it('違う Date なら更新される', async () => {
      const changed = new Date('2024-05-06T07:08:10.456Z')

      await seeder.load('events', 'id', ['id', 'occurred_at'], [[1, changed]], {
        updated_at: true,
      })

      const event = await selectEvent()
      expect(event.occurred_at.getTime()).toBe(changed.getTime())
      expect(event.updated_at.getTime()).toBeGreaterThan(OLD_TIME)
    })
  })

  describe('自動採番の主キーに null を 2 行渡す場合', () => {
    if (dialect.name === 'postgres')
      it.todo(
        '2 行入る（PostgreSQL は SERIAL でも明示した null を採番せず NOT NULL 違反になる。要確認）',
      )
    else
      it('2 行入る', async () => {
        await seeder.load(
          'serials',
          'id',
          ['id', 'name'],
          [
            [null, 'a'],
            [null, 'b'],
          ],
        )

        const rows = await database.select<{ name: string }>(
          'SELECT name FROM serials ORDER BY id',
        )
        expect(rows.map((row) => row.name)).toEqual(['a', 'b'])
      })
  })

  describe('同じ主キーを 1 回の load で 2 回渡す場合（既存行なし）', () => {
    const records = [
      [1, 'first'],
      [1, 'second'],
    ]

    it('1 行になり、後の値が入る', async () => {
      await seeder.load('items', 'id', ['id', 'name'], records)

      const rows = await selectItems()
      expect(rows.map((row) => [row.id, row.name])).toEqual([[1, 'second']])
    })

    it('no_update なら先の値が残る', async () => {
      await seeder.load('items', 'id', ['id', 'name'], records, {
        no_update: true,
      })

      const rows = await selectItems()
      expect(rows.map((row) => [row.id, row.name])).toEqual([[1, 'first']])
    })
  })

  describe('主キーの大文字小文字だけが違う既存行がある場合', () => {
    beforeEach(async () => {
      await database.execute(
        `INSERT INTO keyed (code, name, updated_at) VALUES ('abc', 'before', '${OLD_DATE}')`,
      )
    })

    const selectKeyed = () =>
      database.select<{ code: string; name: string }>(
        'SELECT code, name FROM keyed ORDER BY name',
      )

    it.runIf(dialect.name === 'mysql')(
      '大文字小文字を区別しないので 1 行のまま値が更新される',
      async () => {
        await seeder.load('keyed', 'code', ['code', 'name'], [['ABC', 'after']])

        expect(await selectKeyed()).toEqual([{ code: 'abc', name: 'after' }])
      },
    )

    it.runIf(dialect.name === 'postgres')(
      '大文字小文字を区別するので 2 行になる',
      async () => {
        await seeder.load('keyed', 'code', ['code', 'name'], [['ABC', 'after']])

        expect(await selectKeyed()).toEqual([
          { code: 'ABC', name: 'after' },
          { code: 'abc', name: 'before' },
        ])
      },
    )
  })

  describe('自己参照の外部キー', () => {
    beforeEach(async () => {
      await database.execute(
        `INSERT INTO nodes (id, parent_id, name) VALUES (1, NULL, 'root')`,
      )
    })

    it('既存行の parent_id を、同じ load で新規に入る行へ向けて更新できる', async () => {
      await seeder.load(
        'nodes',
        'id',
        ['id', 'parent_id', 'name'],
        [
          [1, 2, 'root'],
          [2, null, 'new-root'],
        ],
      )

      const rows = await database.select<{
        id: number
        parent_id: number | null
      }>('SELECT id, parent_id FROM nodes ORDER BY id')
      expect(rows).toEqual([
        { id: 1, parent_id: 2 },
        { id: 2, parent_id: null },
      ])
    })
  })

  describe('created_at / updated_at を有効にして新規 2 行を読み込む場合', () => {
    it('両列が入り、2 行で同じ値になる', async () => {
      await seeder.load(
        'items',
        'id',
        ['id', 'name'],
        [
          [1, 'a'],
          [2, 'b'],
        ],
        { created_at: true, updated_at: true },
      )

      const rows = await selectItems()
      const times = rows.flatMap((row) => [
        row.created_at?.getTime(),
        row.updated_at?.getTime(),
      ])
      expect(times.every((time) => typeof time === 'number')).toBe(true)
      expect(new Set(times).size).toBe(1)
    })
  })

  describe('一括 INSERT が NOT NULL 違反になる入力の場合', () => {
    it('load が例外を投げる', async () => {
      await expect(
        seeder.load(
          'items',
          'id',
          ['id', 'name'],
          [
            [1, 'a'],
            [2, null],
          ],
        ),
      ).rejects.toThrow()
    })

    it('何も入らない', async () => {
      await seeder
        .load(
          'items',
          'id',
          ['id', 'name'],
          [
            [1, 'a'],
            [2, null],
          ],
        )
        .catch(() => undefined)

      expect(await selectItems()).toEqual([])
    })
  })
})

describe('Seeder.load 既定の options (mysql)', () => {
  it.todo(
    'options が空でも MySQL に新規行を入れられる（placeholder の既定が "$" で MySQL に "$1" が流れて失敗する。要確認）',
  )
})
