import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { PrismaClient } from '@prisma/client'

import { SeederSqlBuilder } from './seeder-sql-builder'
import { SeederTableGateway } from './seeder-table-gateway'

describe('SeederTableGateway', () => {
  const failure = new Error('db down')
  const client = {
    $executeRawUnsafe: vi.fn().mockRejectedValue(failure),
  } as unknown as PrismaClient
  const gateway = new SeederTableGateway(client, new SeederSqlBuilder('`', '$'))
  let info: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    info = vi.spyOn(console, 'info').mockImplementation(() => {})
  })

  afterEach(() => {
    info.mockRestore()
  })

  describe('insertOne', () => {
    describe('INSERT が失敗した場合', () => {
      it('sql と values をログして同じエラーを投げる', async () => {
        await expect(
          gateway.insertOne('users', ['id', 'name'], [1, 'a']),
        ).rejects.toBe(failure)
        expect(info).toHaveBeenCalledWith({
          sql: 'INSERT INTO `users` (`id`, `name`) VALUES ($1, $2)',
          values: [1, 'a'],
        })
      })
    })
  })

  describe('insertMany', () => {
    describe('INSERT が失敗した場合', () => {
      it('値は出さずに table_name・row_count・pk_values をログして同じエラーを投げる', async () => {
        await expect(
          gateway.insertMany(
            'users',
            ['id', 'name'],
            [
              [1, 'a'],
              [2, 'b'],
            ],
            [1, 2],
          ),
        ).rejects.toBe(failure)
        expect(info).toHaveBeenCalledWith({
          table_name: 'users',
          row_count: 2,
          pk_values: [1, 2],
        })
      })
    })
  })

  describe('update', () => {
    describe('UPDATE が失敗した場合', () => {
      it('pk を含まない values と pk_value を分けてログして同じエラーを投げる', async () => {
        await expect(
          gateway.update('users', 'id', ['name'], ['a'], 9),
        ).rejects.toBe(failure)
        expect(info).toHaveBeenCalledWith({
          sql: 'UPDATE `users` SET `name` = $1 WHERE `id` = $2',
          values: ['a'],
          pk_value: 9,
        })
      })
    })
  })

  describe('selectSchema', () => {
    const gatewayReturning = (query: ReturnType<typeof vi.fn>) =>
      new SeederTableGateway(
        { $queryRawUnsafe: query } as unknown as PrismaClient,
        new SeederSqlBuilder('"', '$'),
      )

    describe('列情報が返る場合', () => {
      const query = vi.fn().mockResolvedValue([
        { column_name: 'id', data_type: 'integer', is_nullable: 'NO' },
        { column_name: 'note', data_type: 'text', is_nullable: 'YES' },
      ])

      it('is_nullable の YES / NO を boolean にした TableSchema を返す', async () => {
        const schema = await gatewayReturning(query).selectSchema('users')

        expect(schema?.isNotNull('id')).toBe(true)
        expect(schema?.isNotNull('note')).toBe(false)
        expect(schema?.isIntegerColumn('id')).toBe(true)
      })
    })

    describe('0 行の場合', () => {
      it('null を返す', async () => {
        const query = vi.fn().mockResolvedValue([])
        expect(await gatewayReturning(query).selectSchema('users')).toBeNull()
      })
    })

    describe('SELECT が失敗する場合', () => {
      it('例外を投げず null を返す', async () => {
        const query = vi.fn().mockRejectedValue(new Error('no such table'))
        expect(await gatewayReturning(query).selectSchema('users')).toBeNull()
      })
    })
  })

  describe('selectSchema', () => {
    describe('列情報の SELECT が失敗した場合', () => {
      it('sql と error をログして null を返す', async () => {
        const select_failure = new Error('no information_schema')
        const select_client = {
          $queryRawUnsafe: vi.fn().mockRejectedValue(select_failure),
        } as unknown as PrismaClient
        const select_gateway = new SeederTableGateway(
          select_client,
          new SeederSqlBuilder('`', '$'),
        )

        expect(await select_gateway.selectSchema('users')).toBeNull()
        expect(info).toHaveBeenCalledWith({
          sql: expect.stringContaining('information_schema.columns'),
          error: select_failure,
        })
      })
    })
  })
})
