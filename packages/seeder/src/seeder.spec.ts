import { describe, it, expect, vi, beforeEach } from 'vitest'

import { PrismaClient } from '@prisma/client'

import { Seeder } from './seeder'

const mockPrismaClient = {
  $queryRawUnsafe: vi.fn(),
  $executeRawUnsafe: vi.fn(),
}

describe('Seeder', () => {
  const seeder = new Seeder(mockPrismaClient as unknown as PrismaClient, {
    placeholder: '$',
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'info').mockImplementation(() => {})
  })

  describe('ユースケース: PostgreSQL の設定（quote: ", placeholder: $）で null を含む値に更新する', () => {
    const postgres_seeder = new Seeder(
      mockPrismaClient as unknown as PrismaClient,
      { quote: '"', placeholder: '$' },
    )

    beforeEach(() => {
      mockPrismaClient.$queryRawUnsafe.mockResolvedValue([
        { id: 'p1', name: 'old_name', hex: '#FFFFFF', release_date: null },
      ])
    })

    it('結果: null の値もプレースホルダに対応させてUPDATE文を実行する', async () => {
      await postgres_seeder.load(
        'paints',
        'id',
        ['id', 'name', 'hex', 'release_date'],
        [['p1', 'new_name', null, '2026-09-28']],
      )

      expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenCalledWith(
        'UPDATE "paints" SET "name" = $1, "hex" = $2, "release_date" = $3 WHERE "id" = $4',
        'new_name',
        null,
        '2026-09-28',
        'p1',
      )
    })
  })

  describe('load', () => {
    describe('ユースケース: bigintを主キーに持つテーブルへレコードを投入する', () => {
      describe('シチュエーション: 対象の主キーの行が存在しない場合', () => {
        beforeEach(() => {
          mockPrismaClient.$queryRawUnsafe.mockResolvedValue([])
        })

        it('結果: bigintの主キー値でINSERT文を実行する', async () => {
          await seeder.load('users', 'id', ['id', 'name'], [[10n, 'test']])

          expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenCalledWith(
            'INSERT INTO `users` (`id`, `name`) VALUES ($1, $2)',
            10n,
            'test',
          )
        })
      })

      describe('シチュエーション: 対象の主キーの行が存在し、DB側の値と異なる場合', () => {
        beforeEach(() => {
          mockPrismaClient.$queryRawUnsafe.mockResolvedValue([
            { id: 10n, name: 'old_name' },
          ])
        })

        it('結果: bigintの主キー値でUPDATE文を実行する', async () => {
          await seeder.load('users', 'id', ['id', 'name'], [[10n, 'new_name']])

          expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenCalledWith(
            'UPDATE `users` SET `name` = $1 WHERE `id` = $2',
            'new_name',
            10n,
          )
        })
      })

      describe('シチュエーション: 対象の主キーの行が存在し、null を含む値で更新する場合', () => {
        beforeEach(() => {
          mockPrismaClient.$queryRawUnsafe.mockResolvedValue([
            { id: 10n, name: 'old_name', nickname: 'old_nickname', memo: null },
          ])
        })

        it('結果: null の値もプレースホルダに対応させてUPDATE文を実行する', async () => {
          await seeder.load(
            'users',
            'id',
            ['id', 'name', 'nickname', 'memo'],
            [[10n, 'new_name', null, 'new_memo']],
          )

          expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenCalledWith(
            'UPDATE `users` SET `name` = $1, `nickname` = $2, `memo` = $3 WHERE `id` = $4',
            'new_name',
            null,
            'new_memo',
            10n,
          )
        })
      })

      describe('シチュエーション: 対象の主キーの行が存在し、DB側の値と同じ(変更なし)場合', () => {
        beforeEach(() => {
          mockPrismaClient.$queryRawUnsafe.mockResolvedValue([
            { id: 10n, name: 'test' },
          ])
        })

        it('結果: UPDATE・INSERTともに実行しない', async () => {
          await seeder.load('users', 'id', ['id', 'name'], [[10n, 'test']])

          expect(mockPrismaClient.$executeRawUnsafe).not.toHaveBeenCalled()
        })
      })

      describe('シチュエーション: DB側がbigintで返り、投入対象が同じ値のnumber/stringの場合', () => {
        it.each([
          { label: 'number', recordValue: 10 },
          { label: 'string', recordValue: '10' },
        ])(
          '結果: 値の型が$labelでも同値であればUPDATEをスキップする',
          async ({ recordValue }) => {
            mockPrismaClient.$queryRawUnsafe.mockResolvedValue([
              { id: 10n, name: 'test' },
            ])

            await seeder.load(
              'users',
              'id',
              ['id', 'name'],
              [[recordValue, 'test']],
            )

            expect(mockPrismaClient.$executeRawUnsafe).not.toHaveBeenCalled()
          },
        )
      })
    })

    describe('ユースケース: bigintを含まないゼロ埋め文字列カラムを持つテーブルへレコードを投入する', () => {
      describe('シチュエーション: 対象の主キーの行が存在し、DB側とゼロ埋め表記のみが異なる場合', () => {
        it('結果: 数値としては同値でも文字列として異なるためUPDATE文を実行する', async () => {
          mockPrismaClient.$queryRawUnsafe.mockResolvedValue([
            { id: 1, zip_code: '0001' },
          ])

          await seeder.load('offices', 'id', ['id', 'zip_code'], [[1, '001']])

          expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenCalledWith(
            'UPDATE `offices` SET `zip_code` = $1 WHERE `id` = $2',
            '001',
            1,
          )
        })
      })
    })

    describe('ユースケース: Dateカラムを持つテーブルへレコードを投入する', () => {
      describe('シチュエーション: 対象の主キーの行が存在し、Dateカラムの値がDB側と同値の場合', () => {
        it('結果: UPDATE・INSERTともに実行しない', async () => {
          const sharedDate = new Date('2024-01-01T00:00:00.000Z')
          mockPrismaClient.$queryRawUnsafe.mockResolvedValue([
            { id: 1, published_at: new Date(sharedDate.getTime()) },
          ])

          await seeder.load(
            'articles',
            'id',
            ['id', 'published_at'],
            [[1, new Date(sharedDate.getTime())]],
          )

          expect(mockPrismaClient.$executeRawUnsafe).not.toHaveBeenCalled()
        })
      })

      describe('シチュエーション: 対象の主キーの行が存在し、DateカラムのみDB側と異なる場合', () => {
        it('結果: UPDATE文を実行する', async () => {
          mockPrismaClient.$queryRawUnsafe.mockResolvedValue([
            { id: 1, published_at: new Date('2024-01-01T00:00:00.000Z') },
          ])

          await seeder.load(
            'articles',
            'id',
            ['id', 'published_at'],
            [[1, new Date('2024-06-01T00:00:00.000Z')]],
          )

          expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenCalledWith(
            'UPDATE `articles` SET `published_at` = $1 WHERE `id` = $2',
            new Date('2024-06-01T00:00:00.000Z'),
            1,
          )
        })
      })
    })
  })

  describe('ユースケース: 複数行をまとめて投入する', () => {
    beforeEach(() => {
      mockPrismaClient.$queryRawUnsafe.mockResolvedValue([])
    })

    describe('シチュエーション: 既存行がなく3行を渡す場合', () => {
      it('結果: SELECTを1回、複数行INSERTを1回実行する', async () => {
        await seeder.load(
          'users',
          'id',
          ['id', 'name'],
          [
            [1, 'a'],
            [2, 'b'],
            [3, 'c'],
          ],
        )

        expect(mockPrismaClient.$queryRawUnsafe).toHaveBeenCalledTimes(1)
        expect(mockPrismaClient.$queryRawUnsafe).toHaveBeenCalledWith(
          'SELECT * FROM `users` WHERE `id` IN ($1, $2, $3)',
          1,
          2,
          3,
        )
        expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenCalledTimes(1)
        expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenCalledWith(
          'INSERT INTO `users` (`id`, `name`) VALUES ($1, $2), ($3, $4), ($5, $6)',
          1,
          'a',
          2,
          'b',
          3,
          'c',
        )
      })
    })

    describe('シチュエーション: 等価な既存行・差分のある既存行・新規行が混在する場合', () => {
      it('結果: 差分のある行だけUPDATEし、新規行だけをINSERTする', async () => {
        mockPrismaClient.$queryRawUnsafe.mockResolvedValue([
          { id: 1, name: 'same' },
          { id: 2, name: 'old' },
        ])

        await seeder.load(
          'users',
          'id',
          ['id', 'name'],
          [
            [1, 'same'],
            [2, 'new'],
            [3, 'fresh'],
          ],
        )

        expect(mockPrismaClient.$queryRawUnsafe).toHaveBeenCalledTimes(1)
        expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenCalledTimes(2)
        expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenCalledWith(
          'UPDATE `users` SET `name` = $1 WHERE `id` = $2',
          'new',
          2,
        )
        expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenCalledWith(
          'INSERT INTO `users` (`id`, `name`) VALUES ($1, $2)',
          3,
          'fresh',
        )
      })
    })

    describe('シチュエーション: 501行を渡す場合', () => {
      it('結果: 500行と1行の2チャンクに分けてSELECTとINSERTを実行する', async () => {
        const records = Array.from({ length: 501 }, (_, i) => [i, `n${i}`])

        await seeder.load('users', 'id', ['id', 'name'], records)

        expect(mockPrismaClient.$queryRawUnsafe).toHaveBeenCalledTimes(2)
        expect(mockPrismaClient.$queryRawUnsafe.mock.calls[0]).toHaveLength(501)
        expect(mockPrismaClient.$queryRawUnsafe.mock.calls[1]).toHaveLength(2)
        expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenCalledTimes(2)
      })
    })

    describe('シチュエーション: カラム数が多くバインド値の上限でチャンクが500行を下回る場合', () => {
      it('結果: 100カラムでは321行ごとに分け、322行は2チャンクになる', async () => {
        const columns = Array.from({ length: 100 }, (_, i) => `c${i}`)
        const records = Array.from({ length: 322 }, (_, i) => [
          i,
          ...Array.from({ length: 99 }, () => 'v'),
        ])

        await seeder.load('wide', 'c0', columns, records)

        expect(mockPrismaClient.$queryRawUnsafe).toHaveBeenCalledTimes(2)
        expect(mockPrismaClient.$queryRawUnsafe.mock.calls[0]).toHaveLength(322)
        expect(mockPrismaClient.$queryRawUnsafe.mock.calls[1]).toHaveLength(2)
      })
    })

    describe('シチュエーション: placeholder が ? の場合', () => {
      it('結果: IN句もVALUES句も ? で組み立てる', async () => {
        const mysql_seeder = new Seeder(
          mockPrismaClient as unknown as PrismaClient,
          { placeholder: '?' },
        )

        await mysql_seeder.load(
          'users',
          'id',
          ['id', 'name'],
          [
            [1, 'a'],
            [2, 'b'],
          ],
        )

        expect(mockPrismaClient.$queryRawUnsafe).toHaveBeenCalledWith(
          'SELECT * FROM `users` WHERE `id` IN (?, ?)',
          1,
          2,
        )
        expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenCalledWith(
          'INSERT INTO `users` (`id`, `name`) VALUES (?, ?), (?, ?)',
          1,
          'a',
          2,
          'b',
        )
      })
    })

    describe('シチュエーション: DB側が主キーをbigintで返し、number で渡して同値の場合', () => {
      it('結果: UPDATEもINSERTも実行しない', async () => {
        mockPrismaClient.$queryRawUnsafe.mockResolvedValue([
          { id: 10n, name: 'test' },
        ])

        await seeder.load('users', 'id', ['id', 'name'], [[10, 'test']])

        expect(mockPrismaClient.$executeRawUnsafe).not.toHaveBeenCalled()
      })
    })

    describe('シチュエーション: no_update で既存行と新規行を渡す場合', () => {
      it('結果: UPDATEせず、新規行だけをINSERTする', async () => {
        mockPrismaClient.$queryRawUnsafe.mockResolvedValue([
          { id: 1, name: 'old' },
        ])

        await seeder.load(
          'users',
          'id',
          ['id', 'name'],
          [
            [1, 'new'],
            [2, 'fresh'],
          ],
          { no_update: true },
        )

        expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenCalledTimes(1)
        expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenCalledWith(
          'INSERT INTO `users` (`id`, `name`) VALUES ($1, $2)',
          2,
          'fresh',
        )
      })
    })

    describe('シチュエーション: created_at と updated_at を有効にして2行を渡す場合', () => {
      it('結果: 末尾に created_at, updated_at を加え、全行に同じ日時を入れる', async () => {
        await seeder.load(
          'users',
          'id',
          ['id', 'name'],
          [
            [1, 'a'],
            [2, 'b'],
          ],
          { created_at: true, updated_at: true },
        )

        const [sql, ...values] =
          mockPrismaClient.$executeRawUnsafe.mock.calls[0] ?? []
        expect(sql).toBe(
          'INSERT INTO `users` (`id`, `name`, `created_at`, `updated_at`) VALUES ($1, $2, $3, $4), ($5, $6, $7, $8)',
        )
        const now = values[2]
        expect(now).toBeInstanceOf(Date)
        expect(values).toEqual([1, 'a', now, now, 2, 'b', now, now])
      })
    })

    describe('シチュエーション: recordsが空の場合', () => {
      it('結果: SQLを1本も実行しない', async () => {
        await seeder.load('users', 'id', ['id', 'name'], [])

        expect(mockPrismaClient.$queryRawUnsafe).not.toHaveBeenCalled()
        expect(mockPrismaClient.$executeRawUnsafe).not.toHaveBeenCalled()
      })
    })
  })
})

type Cell = string | number | bigint | Date | boolean | null
type FakeRow = Record<string, Cell>

type FakeDbOptions = {
  rows: FakeRow[]
  equals?: (a: Cell, b: Cell) => boolean
  auto_increment?: boolean
  validate?: (row: FakeRow, rows: FakeRow[]) => void
}

const createFakeDb = (options: FakeDbOptions) => {
  const equals = options.equals ?? ((a, b) => a === b)
  const rows = options.rows.map((row) => ({ ...row }))
  const statements: string[] = []
  let sequence = 100
  const validate = options.validate ?? (() => {})

  const client = {
    $queryRawUnsafe: async (sql: string, ...values: Cell[]) => {
      statements.push(sql)
      const found = rows.filter((row) =>
        values.some((value) => value !== null && equals(row.id ?? null, value)),
      )
      const copies = found.map((row) => ({ ...row }))
      return sql.includes('LIMIT 1') ? copies.slice(0, 1) : copies
    },
    $executeRawUnsafe: async (sql: string, ...values: Cell[]) => {
      statements.push(sql)
      if (sql.startsWith('UPDATE')) {
        const setters =
          sql
            .match(/SET (.*) WHERE/)?.[1]
            ?.split(', ')
            .map((setter) =>
              (setter.split(' = ')[0] ?? '').replace(/`/g, '').toLowerCase(),
            ) ?? []
        const target = rows.find((row) =>
          equals(row.id ?? null, values[values.length - 1] ?? null),
        )
        if (!target) return
        const updated = { ...target }
        setters.forEach((column, index) => {
          updated[column] = values[index] ?? null
        })
        validate(updated, rows)
        Object.assign(target, updated)
        return
      }
      const columns = sql
        .match(/\(([^)]*)\) VALUES/)?.[1]
        ?.split(', ')
        .map((column) => column.replace(/`/g, '').toLowerCase())
      if (!columns) throw new Error(`Unexpected statement: ${sql}`)
      const staged: FakeRow[] = []
      for (let offset = 0; offset < values.length; offset += columns.length) {
        const row: FakeRow = Object.fromEntries(
          columns.map((column, index) => [
            column,
            values[offset + index] ?? null,
          ]),
        )
        if (row.id === null && options.auto_increment) row.id = sequence++
        validate(row, [...rows, ...staged])
        if (
          [...rows, ...staged].some((existing) =>
            equals(existing.id ?? null, row.id ?? null),
          )
        )
          throw new Error(`Duplicate entry ${String(row.id)}`)
        staged.push(row)
      }
      rows.push(...staged)
    },
  }
  return { client: client as unknown as PrismaClient, rows, statements }
}

const countStatements = (statements: string[], prefix: string) =>
  statements.filter((statement) => statement.startsWith(prefix)).length

describe('Seeder（DBと同じ突き合わせをする疑似DBでの最終状態）', () => {
  const newSeeder = (client: PrismaClient) =>
    new Seeder(client, { placeholder: '?' })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'info').mockImplementation(() => {})
  })

  describe('シチュエーション: 主キーの等価判定がJSの文字列一致と異なる場合', () => {
    it('結果: 大文字小文字を区別しない照合でも、既存行を更新して1行のままにする', async () => {
      const db = createFakeDb({
        rows: [{ id: 'abc', name: 'x' }],
        equals: (a, b) => String(a).toLowerCase() === String(b).toLowerCase(),
      })

      await newSeeder(db.client).load('t', 'id', ['id', 'name'], [['ABC', 'y']])

      expect(db.rows).toEqual([{ id: 'abc', name: 'y' }])
      expect(db.statements.some((sql) => sql.includes('LIMIT 1'))).toBe(true)
    })

    it('結果: 末尾空白を無視する照合でも、既存行を更新して1行のままにする', async () => {
      const db = createFakeDb({
        rows: [{ id: 'a', name: 'x' }],
        equals: (a, b) => String(a).trimEnd() === String(b).trimEnd(),
      })

      await newSeeder(db.client).load('t', 'id', ['id', 'name'], [['a ', 'y']])

      expect(db.rows).toEqual([{ id: 'a', name: 'y' }])
    })

    it('結果: bigint列にゼロ埋め文字列で同値を渡してもINSERTもUPDATEもしない', async () => {
      const db = createFakeDb({
        rows: [{ id: 10n, name: 'x' }],
        equals: (a, b) => BigInt(a as string) === BigInt(b as string),
      })

      await newSeeder(db.client).load(
        't',
        'id',
        ['id', 'name'],
        [['0010', 'x']],
      )

      expect(db.rows).toEqual([{ id: 10n, name: 'x' }])
      expect(countStatements(db.statements, 'INSERT')).toBe(0)
      expect(countStatements(db.statements, 'UPDATE')).toBe(0)
    })

    it('結果: 主キー名の大文字小文字がDBの列名と違っても、重複キーエラーにせず更新する', async () => {
      const db = createFakeDb({ rows: [{ id: 5, name: 'x' }] })

      await newSeeder(db.client).load('t', 'ID', ['ID', 'name'], [[5, 'y']])

      expect(db.rows).toEqual([{ id: 5, name: 'y' }])
    })
  })

  describe('シチュエーション: 主キーがnullのレコードを渡す場合', () => {
    it('結果: 自動採番の列に null を2行渡すと2行になる', async () => {
      const db = createFakeDb({ rows: [], auto_increment: true })

      await newSeeder(db.client).load(
        't',
        'id',
        ['id', 'name'],
        [
          [null, 'a'],
          [null, 'b'],
        ],
      )

      expect(db.rows.map((row) => row.name)).toEqual(['a', 'b'])
    })

    it('結果: 文字列 "null" の主キーと null を混ぜても2行になる', async () => {
      const db = createFakeDb({ rows: [], auto_increment: true })

      await newSeeder(db.client).load(
        't',
        'id',
        ['id', 'name'],
        [
          ['null', 'a'],
          [null, 'b'],
        ],
      )

      expect(db.rows.map((row) => row.name)).toEqual(['a', 'b'])
    })
  })

  describe('シチュエーション: 既存行がなく同じ主キーを2回渡す場合', () => {
    it('結果: 後のレコードの値で1行になる', async () => {
      const db = createFakeDb({ rows: [] })

      await newSeeder(db.client).load(
        't',
        'id',
        ['id', 'name'],
        [
          [1, 'first'],
          [2, 'other'],
          [1, 'second'],
        ],
      )

      expect(db.rows).toEqual([
        { id: 1, name: 'second' },
        { id: 2, name: 'other' },
      ])
    })
  })

  describe('シチュエーション: no_update で同じ主キーを複数回渡す場合', () => {
    it('結果: 既存行がなければ最初のレコードの値で1行になる', async () => {
      const db = createFakeDb({ rows: [] })

      await newSeeder(db.client).load(
        't',
        'id',
        ['id', 'name'],
        [
          [1, 'first'],
          [1, 'second'],
        ],
        { no_update: true },
      )

      expect(db.rows).toEqual([{ id: 1, name: 'first' }])
    })

    it('結果: チャンク境界をまたいで同じ主キーが出ても最初のレコードの値のまま', async () => {
      const db = createFakeDb({ rows: [] })
      const records: Cell[][] = Array.from({ length: 501 }, (_, i) => [
        i + 1,
        `n${i + 1}`,
      ])
      records[500] = [1, 'second']
      records[0] = [1, 'first']

      await newSeeder(db.client).load('t', 'id', ['id', 'name'], records, {
        no_update: true,
      })

      expect(db.rows).toHaveLength(500)
      expect(db.rows.find((row) => row.id === 1)).toEqual({
        id: 1,
        name: 'first',
      })
    })
  })

  describe('シチュエーション: 自己参照の外部キーを持ち、既存行の更新が新規行に依存する場合', () => {
    it('結果: 新規行を先にINSERTしてから更新するため、エラーにならない', async () => {
      const db = createFakeDb({
        rows: [{ id: 7, name: 'child', parent_id: null }],
        validate: (row, rows) => {
          if (row.parent_id === null) return
          if (!rows.some((existing) => existing.id === row.parent_id))
            throw new Error('foreign key constraint fails')
        },
      })

      await newSeeder(db.client).load(
        't',
        'id',
        ['id', 'name', 'parent_id'],
        [
          [5, 'parent', null],
          [7, 'child', 5],
        ],
      )

      expect(db.rows).toEqual([
        { id: 7, name: 'child', parent_id: 5 },
        { id: 5, name: 'parent', parent_id: null },
      ])
    })
  })

  describe('シチュエーション: 複数行INSERTが制約違反で失敗する場合', () => {
    it('結果: 元の例外を投げ、INSERT対象は1行も入らず、1行ずつのSELECTもしない', async () => {
      const db = createFakeDb({
        rows: [],
        validate: (row) => {
          if (row.name === 'bad') throw new Error('constraint violation')
        },
      })

      await expect(
        newSeeder(db.client).load(
          't',
          'id',
          ['id', 'name'],
          [
            [1, 'a'],
            [2, 'bad'],
            [3, 'c'],
          ],
        ),
      ).rejects.toThrow('constraint violation')

      expect(db.rows).toEqual([])
      expect(db.statements.some((sql) => sql.includes('LIMIT 1'))).toBe(false)
      expect(console.info).toHaveBeenCalledWith({
        table_name: 't',
        row_count: 3,
        pk_values: [1, 2, 3],
      })
    })
  })

  describe('シチュエーション: 突き合わせがずれず、新規3行・既存等価1行・既存差分1行を渡す場合', () => {
    it('結果: SELECT 1本・INSERT 1本・UPDATE 1本で済む', async () => {
      const db = createFakeDb({
        rows: [
          { id: 1, name: 'same' },
          { id: 2, name: 'old' },
        ],
      })

      await newSeeder(db.client).load(
        't',
        'id',
        ['id', 'name'],
        [
          [1, 'same'],
          [2, 'new'],
          [3, 'n3'],
          [4, 'n4'],
          [5, 'n5'],
        ],
      )

      expect(countStatements(db.statements, 'SELECT')).toBe(1)
      expect(countStatements(db.statements, 'INSERT')).toBe(1)
      expect(countStatements(db.statements, 'UPDATE')).toBe(1)
      expect(db.rows.map((row) => row.name)).toEqual([
        'same',
        'new',
        'n3',
        'n4',
        'n5',
      ])
    })
  })
})

describe('Seeder（一括処理を使わず1行ずつ処理するチャンク）', () => {
  const newSeeder = (client: PrismaClient) =>
    new Seeder(client, { placeholder: '?' })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'info').mockImplementation(() => {})
  })

  describe('シチュエーション: 大文字小文字を区別しない照合で、DBの既存行と照合上同じ主キーを2回渡す場合', () => {
    const equals = (a: Cell, b: Cell) =>
      String(a).toLowerCase() === String(b).toLowerCase()

    it.each([
      {
        label: '既存行と同じ表記を先に渡す',
        records: [
          ['abc', 'x'],
          ['ABC', 'y'],
        ],
      },
      {
        label: '既存行と違う表記を先に渡す',
        records: [
          ['ABC', 'y'],
          ['abc', 'x'],
        ],
      },
    ])(
      '結果: $labelと、新規扱いになった行が重複キーの例外になり、DBは変わらない',
      async ({ records }) => {
        const db = createFakeDb({ rows: [{ id: 'abc', name: 'old' }], equals })

        await expect(
          newSeeder(db.client).load('t', 'id', ['id', 'name'], records),
        ).rejects.toThrow('Duplicate entry')

        expect(db.rows).toEqual([{ id: 'abc', name: 'old' }])
      },
    )
  })

  describe('シチュエーション: 自己参照の外部キーを持つ空のテーブルに、同じ主キーを2回含むレコードを渡す場合', () => {
    it('結果: エラーにならず、後のレコードの値で2行になる', async () => {
      const db = createFakeDb({
        rows: [],
        validate: (row, rows) => {
          if (row.parent_id === null) return
          if (!rows.some((existing) => existing.id === row.parent_id))
            throw new Error('foreign key constraint fails')
        },
      })

      await newSeeder(db.client).load(
        't',
        'id',
        ['id', 'name', 'parent_id'],
        [
          [5, 'a', null],
          [6, 'b', 5],
          [5, 'c', 6],
        ],
      )

      expect(db.rows).toHaveLength(2)
      expect(db.rows.find((row) => row.id === 5)).toEqual({
        id: 5,
        name: 'c',
        parent_id: 6,
      })
    })
  })

  describe('シチュエーション: チャンク内に同じ主キーが2回ある場合', () => {
    it('結果: 1行ずつのSELECTで処理し、IN のSELECTは発行しない', async () => {
      const db = createFakeDb({ rows: [] })

      await newSeeder(db.client).load(
        't',
        'id',
        ['id', 'name'],
        [
          [1, 'a'],
          [1, 'b'],
        ],
      )

      const selects = db.statements.filter((sql) => sql.startsWith('SELECT'))
      expect(selects.length).toBeGreaterThan(0)
      expect(selects.every((sql) => sql.includes('LIMIT 1'))).toBe(true)
      expect(selects.some((sql) => sql.includes(' IN ('))).toBe(false)
    })
  })

  describe('シチュエーション: 一括INSERTが失敗し、同じチャンクに既存行の更新も含まれる場合', () => {
    it('結果: 元の例外を投げ、INSERT対象は入らず、既存行は更新されず、1行ずつのSELECTもしない', async () => {
      const db = createFakeDb({
        rows: [
          { id: 1, name: 'old1' },
          { id: 4, name: 'old4' },
        ],
        validate: (row) => {
          if (row.name === 'bad') throw new Error('constraint violation')
        },
      })

      await expect(
        newSeeder(db.client).load(
          't',
          'id',
          ['id', 'name'],
          [
            [1, 'new1'],
            [2, 'a'],
            [3, 'bad'],
            [4, 'new4'],
          ],
        ),
      ).rejects.toThrow('constraint violation')

      expect(db.rows).toEqual([
        { id: 1, name: 'old1' },
        { id: 4, name: 'old4' },
      ])
      expect(countStatements(db.statements, 'UPDATE')).toBe(0)
      expect(db.statements.some((sql) => sql.includes('LIMIT 1'))).toBe(false)
      expect(console.info).toHaveBeenCalledWith({
        table_name: 't',
        row_count: 2,
        pk_values: [2, 3],
      })
    })

    it('結果: 疑似DBが投げたエラーそのものを投げる', async () => {
      const error = new Error('constraint violation')
      const db = createFakeDb({
        rows: [],
        validate: () => {
          throw error
        },
      })

      await expect(
        newSeeder(db.client).load('t', 'id', ['id', 'name'], [[1, 'a']]),
      ).rejects.toBe(error)
    })
  })

  describe('シチュエーション: created_at と updated_at を有効にして、同じ主キーを2回含むレコードを渡す場合', () => {
    it('結果: 1行ずつのINSERTでも created_at と updated_at が同じ Date になる', async () => {
      const db = createFakeDb({ rows: [] })

      await new Seeder(db.client, {
        placeholder: '?',
        created_at: true,
        updated_at: true,
      }).load(
        't',
        'id',
        ['id', 'name'],
        [
          [1, 'a'],
          [2, 'b'],
          [1, 'a'],
        ],
      )

      const row = db.rows[0]
      expect(row?.created_at).toBeInstanceOf(Date)
      expect(row?.updated_at).toBe(row?.created_at)
    })
  })
})
