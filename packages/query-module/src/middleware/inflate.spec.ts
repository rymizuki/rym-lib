import type { QueryResultList, QueryRunnerCriteria } from '../'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { inflate, deflate } from './inflate'

type TestData = {
  id: string
  tenant_id: string
  name: string
  units: Array<{
    id: string
    name: string
    user_id?: string
  }>
  staffs: Array<{
    id: string
    user_id: string
    name: string
  }>
  nested: {
    deeply: {
      id: string
      items: Array<{
        id: string
        value: string
      }>
    }
  }
}

describe('inflate', () => {
  let mockIteratee: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockIteratee = vi.fn((value, _key, _path) => `transformed_${value}`)
  })

  describe('inflate', () => {
    describe('シンプルなキー指定での処理', () => {
      describe('第1階層のキーを変換する場合', () => {
        it('指定されたキーの値が変換される', async () => {
          const middleware = inflate<TestData>(
            ['id', 'tenant_id'],
            mockIteratee,
          )

          const result: QueryResultList<TestData> = {
            items: [
              {
                id: '123',
                tenant_id: '456',
                name: 'Test',
                units: [],
                staffs: [],
                nested: { deeply: { id: '999', items: [] } },
              },
            ],
          }

          await middleware.postprocess!(result, {} as any, {} as any)

          expect(result.items[0]?.id).toBe('transformed_123')
          expect(result.items[0]?.tenant_id).toBe('transformed_456')
          expect(result.items[0]?.name).toBe('Test') // 変換されない
          expect(mockIteratee).toHaveBeenCalledWith('123', 'id', 'id')
          expect(mockIteratee).toHaveBeenCalledWith(
            '456',
            'tenant_id',
            'tenant_id',
          )
        })
      })

      describe('指定されていないキーの場合', () => {
        it('変換されない', async () => {
          const middleware = inflate<TestData>(['id'], mockIteratee)

          const result: QueryResultList<TestData> = {
            items: [
              {
                id: '123',
                tenant_id: '456',
                name: 'Test',
                units: [],
                staffs: [],
                nested: { deeply: { id: '999', items: [] } },
              },
            ],
          }

          await middleware.postprocess!(result, {} as any, {} as any)

          expect(result.items[0]?.id).toBe('transformed_123')
          expect(result.items[0]?.tenant_id).toBe('456') // 変換されない
          expect(result.items[0]?.name).toBe('Test')
        })
      })
    })

    describe('ドット記法でのパス指定', () => {
      describe('units.idを指定した場合', () => {
        it('units配列内のidフィールドが変換される', async () => {
          const middleware = inflate<TestData>(['units.id'], mockIteratee)

          const result: QueryResultList<TestData> = {
            items: [
              {
                id: '123',
                tenant_id: '456',
                name: 'Test',
                units: [
                  { id: '789', name: 'Unit1' },
                  { id: '012', name: 'Unit2' },
                ],
                staffs: [],
                nested: { deeply: { id: '999', items: [] } },
              },
            ],
          }

          await middleware.postprocess!(result, {} as any, {} as any)

          expect(result.items[0]?.id).toBe('123') // 変換されない
          expect(result.items[0]?.units?.[0]?.id).toBe('transformed_789')
          expect(result.items[0]?.units?.[1]?.id).toBe('transformed_012')
          expect(result.items[0]?.units?.[0]?.name).toBe('Unit1') // 変換されない
          expect(mockIteratee).toHaveBeenCalledWith('789', 'id', 'units.id')
          expect(mockIteratee).toHaveBeenCalledWith('012', 'id', 'units.id')
        })
      })

      describe('staffs.user_idを指定した場合', () => {
        it('staffs配列内のuser_idフィールドが変換される', async () => {
          const middleware = inflate<TestData>(['staffs.user_id'], mockIteratee)

          const result: QueryResultList<TestData> = {
            items: [
              {
                id: '123',
                tenant_id: '456',
                name: 'Test',
                units: [],
                staffs: [
                  { id: '345', user_id: '678', name: 'Staff1' },
                  { id: '901', user_id: '234', name: 'Staff2' },
                ],
                nested: { deeply: { id: '999', items: [] } },
              },
            ],
          }

          await middleware.postprocess!(result, {} as any, {} as any)

          expect(result.items[0]?.staffs?.[0]?.id).toBe('345') // 変換されない
          expect(result.items[0]?.staffs?.[0]?.user_id).toBe('transformed_678')
          expect(result.items[0]?.staffs?.[1]?.user_id).toBe('transformed_234')
          expect(mockIteratee).toHaveBeenCalledWith(
            '678',
            'user_id',
            'staffs.user_id',
          )
          expect(mockIteratee).toHaveBeenCalledWith(
            '234',
            'user_id',
            'staffs.user_id',
          )
        })
      })

      describe('深くネストされたパスの場合', () => {
        it('nested.deeply.items.idが変換される', async () => {
          const middleware = inflate<TestData>(
            ['nested.deeply.items.id'],
            mockIteratee,
          )

          const result: QueryResultList<TestData> = {
            items: [
              {
                id: '123',
                tenant_id: '456',
                name: 'Test',
                units: [],
                staffs: [],
                nested: {
                  deeply: {
                    id: '999',
                    items: [
                      { id: '111', value: 'Item1' },
                      { id: '222', value: 'Item2' },
                    ],
                  },
                },
              },
            ],
          }

          await middleware.postprocess!(result, {} as any, {} as any)

          expect(result.items[0]?.nested?.deeply?.id).toBe('999') // 変換されない
          expect(result.items[0]?.nested?.deeply?.items?.[0]?.id).toBe(
            'transformed_111',
          )
          expect(result.items[0]?.nested?.deeply?.items?.[1]?.id).toBe(
            'transformed_222',
          )
          expect(mockIteratee).toHaveBeenCalledWith(
            '111',
            'id',
            'nested.deeply.items.id',
          )
          expect(mockIteratee).toHaveBeenCalledWith(
            '222',
            'id',
            'nested.deeply.items.id',
          )
        })
      })
    })

    describe('ワイルドカード指定', () => {
      describe('*.idを指定した場合', () => {
        it('すべてのネストレベルのidフィールドが変換される', async () => {
          const middleware = inflate<TestData>(['*.id'], mockIteratee)

          const result: QueryResultList<TestData> = {
            items: [
              {
                id: '123',
                tenant_id: '456',
                name: 'Test',
                units: [{ id: '789', name: 'Unit1' }],
                staffs: [{ id: '345', user_id: '678', name: 'Staff1' }],
                nested: {
                  deeply: {
                    id: '999',
                    items: [{ id: '111', value: 'Item1' }],
                  },
                },
              },
            ],
          }

          await middleware.postprocess!(result, {} as any, {} as any)

          expect(result.items[0]?.id).toBe('transformed_123')
          expect(result.items[0]?.units?.[0]?.id).toBe('transformed_789')
          expect(result.items[0]?.staffs?.[0]?.id).toBe('transformed_345')
          expect(result.items[0]?.nested?.deeply?.id).toBe('transformed_999')
          expect(result.items[0]?.nested?.deeply?.items?.[0]?.id).toBe(
            'transformed_111',
          )
          expect(result.items[0]?.staffs?.[0]?.user_id).toBe('678') // 変換されない
        })
      })
    })

    describe('複数のパス指定', () => {
      describe('複数のパターンを組み合わせた場合', () => {
        it('すべての指定されたパスが変換される', async () => {
          const middleware = inflate<TestData>(
            ['id', 'tenant_id', 'units.id', 'staffs.user_id'],
            mockIteratee,
          )

          const result: QueryResultList<TestData> = {
            items: [
              {
                id: '123',
                tenant_id: '456',
                name: 'Test',
                units: [{ id: '789', name: 'Unit1' }],
                staffs: [{ id: '345', user_id: '678', name: 'Staff1' }],
                nested: { deeply: { id: '999', items: [] } },
              },
            ],
          }

          await middleware.postprocess!(result, {} as any, {} as any)

          expect(result.items[0]?.id).toBe('transformed_123')
          expect(result.items[0]?.tenant_id).toBe('transformed_456')
          expect(result.items[0]?.units?.[0]?.id).toBe('transformed_789')
          expect(result.items[0]?.staffs?.[0]?.user_id).toBe('transformed_678')
          expect(result.items[0]?.staffs?.[0]?.id).toBe('345') // 指定されていないので変換されない
          expect(result.items[0]?.nested?.deeply?.id).toBe('999') // 指定されていないので変換されない
        })
      })
    })

    describe('エッジケース', () => {
      describe('null値の処理', () => {
        it('null値はそのまま返される', async () => {
          const middleware = inflate<TestData>(['id'], mockIteratee)

          const result: QueryResultList<TestData> = {
            items: [null as any],
          }

          await middleware.postprocess!(result, {} as any, {} as any)

          expect(result.items[0]).toBe(null)
          expect(mockIteratee).not.toHaveBeenCalled()
        })
      })

      describe('undefined値の処理', () => {
        it('undefined値はそのまま返される', async () => {
          const middleware = inflate<TestData>(['id'], mockIteratee)

          const result: QueryResultList<TestData> = {
            items: [undefined as any],
          }

          await middleware.postprocess!(result, {} as any, {} as any)

          expect(result.items[0]).toBe(undefined)
          expect(mockIteratee).not.toHaveBeenCalled()
        })
      })

      describe('空配列の処理', () => {
        it('空配列はそのまま返される', async () => {
          const middleware = inflate<TestData>(['units.id'], mockIteratee)

          const result: QueryResultList<TestData> = {
            items: [
              {
                id: '123',
                tenant_id: '456',
                name: 'Test',
                units: [],
                staffs: [],
                nested: { deeply: { id: '999', items: [] } },
              },
            ],
          }

          await middleware.postprocess!(result, {} as any, {} as any)

          expect(result.items[0]?.units).toEqual([])
          expect(mockIteratee).not.toHaveBeenCalled()
        })
      })

      describe('文字列以外の値の処理', () => {
        it('文字列以外の値は変換されない', async () => {
          const middleware = inflate<any>(['id'], mockIteratee)

          const result: QueryResultList<any> = {
            items: [
              {
                id: 123, // 数値
                other_id: true, // boolean
              },
            ],
          }

          await middleware.postprocess!(result, {} as any, {} as any)

          expect(result.items[0]?.id).toBe(123)
          expect(result.items[0]?.other_id).toBe(true)
          expect(mockIteratee).not.toHaveBeenCalled()
        })
      })

      describe('特殊なオブジェクト型の処理', () => {
        it('Date、bigint、booleanなどの値は再帰処理をスキップする', async () => {
          const middleware = inflate<any>(['*.id', 'id'], mockIteratee)

          const testDate = new Date('2023-01-01')
          const testRegex = /test/g
          const testError = new Error('test error')

          const result: QueryResultList<any> = {
            items: [
              {
                id: '123',
                date_field: testDate,
                regex_field: testRegex,
                error_field: testError,
                boolean_field: true,
                bigint_field: BigInt(9007199254740991),
                number_field: 42,
                null_field: null,
                undefined_field: undefined,
                nested: {
                  date: testDate,
                  id: '456',
                },
              },
            ],
          }

          await middleware.postprocess!(result, {} as any, {} as any)

          // 文字列値のみ変換される
          expect(result.items[0]?.id).toBe('transformed_123')
          expect(result.items[0]?.nested.id).toBe('transformed_456')

          // 特殊な型は変換されない（同じインスタンスのまま）
          expect(result.items[0]?.date_field).toBe(testDate)
          expect(result.items[0]?.regex_field).toBe(testRegex)
          expect(result.items[0]?.error_field).toBe(testError)
          expect(result.items[0]?.boolean_field).toBe(true)
          expect(result.items[0]?.bigint_field).toBe(BigInt(9007199254740991))
          expect(result.items[0]?.number_field).toBe(42)
          expect(result.items[0]?.null_field).toBe(null)
          expect(result.items[0]?.undefined_field).toBe(undefined)
          expect(result.items[0]?.nested.date).toBe(testDate)

          // mockIterateeは文字列値に対してのみ呼ばれる
          expect(mockIteratee).toHaveBeenCalledWith('123', 'id', '*.id')
          expect(mockIteratee).toHaveBeenCalledWith('456', 'id', '*.id')
          expect(mockIteratee).not.toHaveBeenCalledWith(
            testDate,
            expect.any(String),
            expect.any(String),
          )
          expect(mockIteratee).not.toHaveBeenCalledWith(
            true,
            expect.any(String),
            expect.any(String),
          )
          expect(mockIteratee).not.toHaveBeenCalledWith(
            42,
            expect.any(String),
            expect.any(String),
          )
        })

        it('TypedArrayやMap、Setなどの組み込みオブジェクトも再帰処理をスキップする', async () => {
          const middleware = inflate<any>(['id'], mockIteratee)

          const testMap = new Map([['key', 'value']])
          const testSet = new Set([1, 2, 3])
          const testUint8Array = new Uint8Array([1, 2, 3])

          const result: QueryResultList<any> = {
            items: [
              {
                id: '123',
                map_field: testMap,
                set_field: testSet,
                typed_array_field: testUint8Array,
              },
            ],
          }

          await middleware.postprocess!(result, {} as any, {} as any)

          // 文字列値のみ変換される
          expect(result.items[0]?.id).toBe('transformed_123')

          // 組み込みオブジェクトは変換されない（同じインスタンスのまま）
          expect(result.items[0]?.map_field).toBe(testMap)
          expect(result.items[0]?.set_field).toBe(testSet)
          expect(result.items[0]?.typed_array_field).toBe(testUint8Array)

          // mockIterateeは文字列値に対してのみ呼ばれる
          expect(mockIteratee).toHaveBeenCalledWith('123', 'id', 'id')
          expect(mockIteratee).not.toHaveBeenCalledWith(
            testMap,
            expect.any(String),
            expect.any(String),
          )
          expect(mockIteratee).not.toHaveBeenCalledWith(
            testSet,
            expect.any(String),
            expect.any(String),
          )
          expect(mockIteratee).not.toHaveBeenCalledWith(
            testUint8Array,
            expect.any(String),
            expect.any(String),
          )
        })
      })
    })
  })

  describe('deflate', () => {
    describe('プリプロセス処理', () => {
      describe('フィルター条件のデコード', () => {
        it('指定されたカラムのフィルター値が変換される', async () => {
          const middleware = deflate<TestData>(
            ['id', 'tenant_id'],
            mockIteratee,
          )

          const criteria: QueryRunnerCriteria<TestData> = {
            filter: {
              id: { eq: 'encoded_123' },
              tenant_id: { eq: 'encoded_456' },
              name: { eq: 'test_name' },
            },
          }

          await middleware.preprocess!(criteria, {} as any)

          expect((criteria.filter as any).id!.eq).toBe(
            'transformed_encoded_123',
          )
          expect((criteria.filter as any).tenant_id!.eq).toBe(
            'transformed_encoded_456',
          )
          expect((criteria.filter as any).name!.eq).toBe('test_name') // 変換されない
          expect(mockIteratee).toHaveBeenCalledWith(
            'encoded_123',
            'eq',
            'id.eq',
          )
          expect(mockIteratee).toHaveBeenCalledWith(
            'encoded_456',
            'eq',
            'tenant_id.eq',
          )
        })
      })

      describe('複数フィルター条件のデコード', () => {
        it('配列形式のfilter条件内の値が再帰的に変換される', async () => {
          const middleware = deflate<TestData>(
            ['id', 'nested.deeply.id'],
            mockIteratee,
          )

          const criteria: QueryRunnerCriteria<TestData> = {
            filter: [
              {
                id: { eq: 'encoded_123' },
              },
              {
                nested: {
                  deeply: {
                    id: { eq: 'encoded_999' },
                  },
                },
              } as any,
            ],
          }

          await middleware.preprocess!(criteria, {} as any)

          expect((criteria.filter as any)[0].id!.eq).toBe(
            'transformed_encoded_123',
          )
          expect((criteria.filter as any)[1].nested.deeply.id.eq).toBe(
            'transformed_encoded_999',
          )
        })
      })

      describe('パス展開機能', () => {
        it('operatorが指定されていないパスは全operatorに展開される', async () => {
          const middleware = deflate<TestData>(['id'], mockIteratee)

          // 複数のoperatorでテスト
          const criteriaEq: QueryRunnerCriteria<TestData> = {
            filter: { id: { eq: 'encoded_123' } },
          }
          const criteriaNe: QueryRunnerCriteria<TestData> = {
            filter: { id: { ne: 'encoded_456' } },
          }
          const criteriaContains: QueryRunnerCriteria<TestData> = {
            filter: { id: { contains: 'encoded_789' } },
          }

          await middleware.preprocess!(criteriaEq, {} as any)
          await middleware.preprocess!(criteriaNe, {} as any)
          await middleware.preprocess!(criteriaContains, {} as any)

          // eq operatorが変換される
          expect((criteriaEq.filter as any).id!.eq).toBe(
            'transformed_encoded_123',
          )
          // ne operatorが変換される
          expect((criteriaNe.filter as any).id!.ne).toBe(
            'transformed_encoded_456',
          )
          // contains operatorが変換される
          expect((criteriaContains.filter as any).id!.contains).toBe(
            'transformed_encoded_789',
          )
        })

        it('既にoperatorが指定されているパスはそのまま使用される', async () => {
          const middleware = deflate<TestData>(['id.eq'], mockIteratee)

          const criteria: QueryRunnerCriteria<TestData> = {
            filter: {
              id: { eq: 'encoded_123', ne: 'encoded_456' },
            },
          }

          await middleware.preprocess!(criteria, {} as any)

          // eq operatorのみ変換される
          expect((criteria.filter as any).id!.eq).toBe(
            'transformed_encoded_123',
          )
          // ne operatorは変換されない（指定されていないため）
          expect((criteria.filter as any).id!.ne).toBe('encoded_456')
        })
      })
    })
  })

  describe('deflate (preprocess)', () => {
    describe('検索条件の変換', () => {
      it('検索条件のid値が正しく変換される', () => {
        const middleware = deflate<any>(['id'], mockIteratee)

        const criteria = {
          filter: {
            id: { in: ['encoded_123', 'encoded_456'] },
            name: { eq: 'test' },
          },
        }

        middleware.preprocess!(criteria, {} as any)

        expect(criteria.filter.id.in).toEqual([
          'transformed_encoded_123',
          'transformed_encoded_456',
        ])
        expect(criteria.filter.name.eq).toBe('test') // 変換されない
        expect(mockIteratee).toHaveBeenCalledWith('encoded_123', 'in', 'id.in')
        expect(mockIteratee).toHaveBeenCalledWith('encoded_456', 'in', 'id.in')
      })

      it('配列形式の検索条件も正しく変換される', () => {
        const middleware = deflate<any>(['id'], mockIteratee)

        const criteria = {
          filter: [
            { id: { eq: 'encoded_123' } },
            { id: { in: ['encoded_456', 'encoded_789'] } },
          ],
        }

        middleware.preprocess!(criteria, {} as any)

        expect(criteria.filter?.[0]?.id?.eq).toBe('transformed_encoded_123')
        expect(criteria.filter?.[1]?.id?.in).toEqual([
          'transformed_encoded_456',
          'transformed_encoded_789',
        ])
      })

      it('エンコード時に配列値も正しく変換される', async () => {
        const middleware = inflate<any>(['*.id'], mockIteratee)

        const result: QueryResultList<any> = {
          items: [
            {
              id: ['123', '456'], // 配列形式のID（稀なケースだが）
              staff: {
                id: ['789', '012'],
              },
            },
          ],
        }

        await middleware.postprocess!(result, {} as any, {} as any)

        expect(result.items[0]?.id).toEqual([
          'transformed_123',
          'transformed_456',
        ])
        expect(result.items[0]?.staff.id).toEqual([
          'transformed_789',
          'transformed_012',
        ])
      })
    })
  })
})
