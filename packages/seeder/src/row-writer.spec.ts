import { describe, expect, it, vi } from 'vitest'

import { RecordComparator } from './record-comparator'
import { RowWriter } from './row-writer'
import { SeedTarget } from './seed-target'
import type { SeederTableGateway } from './seeder-table-gateway'
import { TableSchema } from './table-schema'
import { TimestampStamper } from './timestamp-stamper'

describe('RowWriter', () => {
  const gateway = {
    insertMany: vi.fn().mockResolvedValue(undefined),
    insertOne: vi.fn().mockResolvedValue(undefined),
  }
  const writer = new RowWriter(
    gateway as unknown as SeederTableGateway,
    new RecordComparator(),
    new TimestampStamper(),
  )
  const schema = new TableSchema([
    { name: 'id', data_type: 'integer', is_nullable: false },
    { name: 'name', data_type: 'text', is_nullable: true },
  ])
  const target = SeedTarget.create('users', 'id', ['id', 'name'], {})

  describe('insertMany', () => {
    describe('pk が NOT NULL の schema で、[null, 5, null] の順に渡す場合', () => {
      it('連続する区間ごとの 3 本の INSERT にし、null の区間だけ pk 列を外す', async () => {
        gateway.insertMany.mockClear()

        await writer.insertMany(target.withSchema(schema), [
          [null, 'a'],
          [5, 'b'],
          [null, 'c'],
        ])

        expect(gateway.insertMany.mock.calls).toEqual([
          ['users', ['name'], [['a']], [null]],
          ['users', ['id', 'name'], [[5, 'b']], [5]],
          ['users', ['name'], [['c']], [null]],
        ])
      })

      it('同じ種類の行が続けば 1 本にまとめる', async () => {
        gateway.insertMany.mockClear()

        await writer.insertMany(target.withSchema(schema), [
          [null, 'a'],
          [null, 'b'],
          [5, 'c'],
          [6, 'd'],
        ])

        expect(gateway.insertMany.mock.calls).toEqual([
          ['users', ['name'], [['a'], ['b']], [null, null]],
          [
            'users',
            ['id', 'name'],
            [
              [5, 'c'],
              [6, 'd'],
            ],
            [5, 6],
          ],
        ])
      })
    })

    describe('schema が無い場合', () => {
      it('null の pk も列に含め、1 本の INSERT にする', async () => {
        gateway.insertMany.mockClear()

        await writer.insertMany(target, [
          [null, 'a'],
          [5, 'b'],
        ])

        expect(gateway.insertMany.mock.calls).toEqual([
          [
            'users',
            ['id', 'name'],
            [
              [null, 'a'],
              [5, 'b'],
            ],
            [null, 5],
          ],
        ])
      })
    })

    describe('records が空の場合', () => {
      it('INSERT を発行しない', async () => {
        gateway.insertMany.mockClear()
        await writer.insertMany(target.withSchema(schema), [])
        expect(gateway.insertMany).not.toHaveBeenCalled()
      })
    })
  })

  describe('insertOne', () => {
    it('pk が null で pk が NOT NULL なら、pk 列を外して INSERT する', async () => {
      gateway.insertOne.mockClear()
      await writer.insertOne(target.withSchema(schema), [null, 'a'])
      expect(gateway.insertOne).toHaveBeenCalledWith('users', ['name'], ['a'])
    })

    it('pk の値があれば pk 列を含めて INSERT する', async () => {
      gateway.insertOne.mockClear()
      await writer.insertOne(target.withSchema(schema), [5, 'a'])
      expect(gateway.insertOne).toHaveBeenCalledWith(
        'users',
        ['id', 'name'],
        [5, 'a'],
      )
    })
  })
})
