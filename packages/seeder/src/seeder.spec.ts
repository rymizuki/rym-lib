import { describe, it, expect, vi, beforeEach } from 'vitest'

import { PrismaClient } from '@prisma/client'

import { Seeder } from './seeder'

const mockPrismaClient = {
  $queryRawUnsafe: vi.fn(),
  $executeRawUnsafe: vi.fn(),
}

describe('Seeder', () => {
  const seeder = new Seeder(mockPrismaClient as unknown as PrismaClient, {})

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'info').mockImplementation(() => {})
  })

  describe('load', () => {
    describe('ユースケース: bigintを主キーに持つテーブルへレコードを投入する', () => {
      describe('シチュエーション: 対象の主キーの行が存在しない場合', () => {
        beforeEach(() => {
          mockPrismaClient.$queryRawUnsafe.mockResolvedValue([])
        })

        it('結果: bigintの主キー値でINSERT文を実行する', async () => {
          await seeder.load(
            'users',
            'id',
            ['id', 'name'],
            [[10n, 'test']],
          )

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
          await seeder.load(
            'users',
            'id',
            ['id', 'name'],
            [[10n, 'new_name']],
          )

          expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenCalledWith(
            'UPDATE `users` SET `name` = $1 WHERE `id` = $2',
            'new_name',
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
          await seeder.load(
            'users',
            'id',
            ['id', 'name'],
            [[10n, 'test']],
          )

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
})
