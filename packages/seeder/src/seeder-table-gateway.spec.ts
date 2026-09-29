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
})
