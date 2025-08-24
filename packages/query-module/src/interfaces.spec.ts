import { describe, it, expectTypeOf } from 'vitest'
import type {
  QueryFilter,
  QueryRunnerCriteria,
  QueryRunnerInterface,
  QueryResultList
} from './interfaces'

// テスト用のデータ型定義
type TestData = {
  id: string
  name: string
  age: number
  email: string | null
  created_at: Date
}

describe('QueryFilter Type Extensions', () => {
  describe('基本的な型チェック', () => {
    it('元のDataプロパティが型安全に利用できる', () => {
      const filter: QueryFilter<TestData> = {
        id: { eq: 'test' },
        name: { contains: 'john' },
        age: { gte: 18 },
        email: { ne: null },
        created_at: { lt: new Date() }
      }

      // 型チェック: 元のプロパティは正常に型推論される
      expectTypeOf(filter.id).toEqualTypeOf<
        | Partial<{
            contains: any
            not_contains: any
            eq: any
            ne: any
            lte: any
            lt: any
            gte: any
            gt: any
            in: any[]
          }>
        | undefined
      >()
    })

    it('任意の文字列プロパティが許可される', () => {
      const filter: QueryFilter<TestData> = {
        // 元のプロパティ
        name: { eq: 'test' },
        
        // 拡張されたプロパティ（型エラーにならない）
        telephone: { eq: '080-1234-5678' },
        custom_field: { ne: null },
        'user.profile.bio': { contains: 'developer' },
        search_query: { in: ['keyword1', 'keyword2'] }
      }

      // ランタイムでのプロパティ存在チェック
      expect(filter.telephone).toBeDefined()
      expect(filter.custom_field).toBeDefined()
      expect(filter['user.profile.bio']).toBeDefined()
      expect(filter.search_query).toBeDefined()
    })
  })

  describe('HAVING句プレフィックス対応', () => {
    it('having:プレフィックス付きプロパティが許可される', () => {
      const filter: QueryFilter<TestData> = {
        name: { eq: 'test' },
        'having:COUNT(*)': { gt: 10 },
        'having:SUM(amount)': { gte: 1000 },
        'having:AVG(score)': { lt: 80 },
        'having:MAX(created_at)': { ne: null }
      }

      expect(filter['having:COUNT(*)']).toEqual({ gt: 10 })
      expect(filter['having:SUM(amount)']).toEqual({ gte: 1000 })
      expect(filter['having:AVG(score)']).toEqual({ lt: 80 })
      expect(filter['having:MAX(created_at)']).toEqual({ ne: null })
    })
  })

  describe('JOIN・RAW SQL式対応', () => {
    it('JOINしたテーブルのフィールドが使用可能', () => {
      const filter: QueryFilter<TestData> = {
        id: { eq: '123' },
        'orders.total_amount': { gte: 10000 },
        'user_profiles.bio': { contains: 'engineer' },
        'categories.name': { in: ['tech', 'business'] }
      }

      expect(filter['orders.total_amount']).toEqual({ gte: 10000 })
      expect(filter['user_profiles.bio']).toEqual({ contains: 'engineer' })
      expect(filter['categories.name']).toEqual({ in: ['tech', 'business'] })
    })

    it('RAW SQL式が使用可能', () => {
      const filter: QueryFilter<TestData> = {
        name: { eq: 'test' },
        "CONCAT(first_name, ' ', last_name)": { eq: 'John Doe' },
        'YEAR(created_at)': { eq: 2024 },
        'LOWER(email)': { contains: '@example.com' }
      }

      expect(filter["CONCAT(first_name, ' ', last_name)"]).toEqual({ eq: 'John Doe' })
      expect(filter['YEAR(created_at)']).toEqual({ eq: 2024 })
      expect(filter['LOWER(email)']).toEqual({ contains: '@example.com' })
    })
  })

  describe('QueryRunnerCriteria統合テスト', () => {
    it('拡張されたQueryFilterがQueryRunnerCriteriaで正常動作する', () => {
      const criteria: QueryRunnerCriteria<TestData> = {
        filter: {
          // 元のプロパティ
          name: { contains: 'john' },
          age: { gte: 18 },
          
          // 拡張プロパティ
          telephone: { eq: '080-1234-5678' },
          'having:COUNT(orders.id)': { gte: 5 },
          'user_profiles.location': { eq: 'Tokyo' }
        },
        orderBy: 'name:asc',
        take: 10,
        skip: 0
      }

      expect(criteria.filter).toBeDefined()
      expect(typeof criteria.filter).toBe('object')
      
      // フィルタープロパティの存在確認
      if (criteria.filter && !Array.isArray(criteria.filter)) {
        expect(criteria.filter.name).toEqual({ contains: 'john' })
        expect(criteria.filter.telephone).toEqual({ eq: '080-1234-5678' })
        expect(criteria.filter['having:COUNT(orders.id)']).toEqual({ gte: 5 })
        expect(criteria.filter['user_profiles.location']).toEqual({ eq: 'Tokyo' })
      }
    })

    it('配列形式のフィルターでも拡張プロパティが使用可能', () => {
      const criteria: QueryRunnerCriteria<TestData> = {
        filter: [
          {
            name: { eq: 'john' },
            telephone: { eq: '080-1111-2222' }
          },
          {
            age: { gte: 25 },
            'having:COUNT(*)': { gt: 0 },
            custom_status: { ne: 'inactive' }
          }
        ],
        take: 5
      }

      expect(Array.isArray(criteria.filter)).toBe(true)
      expect(criteria.filter).toHaveLength(2)
      
      if (Array.isArray(criteria.filter)) {
        expect(criteria.filter[0].telephone).toEqual({ eq: '080-1111-2222' })
        expect(criteria.filter[1]['having:COUNT(*)']).toEqual({ gt: 0 })
        expect(criteria.filter[1].custom_status).toEqual({ ne: 'inactive' })
      }
    })
  })

  describe('QueryRunnerInterface統合テスト', () => {
    it('拡張されたParamsがQueryRunnerInterfaceで使用可能', () => {
      // 拡張されたQueryRunnerCriteriaを定義
      type ExtendedParams = QueryRunnerCriteria<TestData>
      type TestList = QueryResultList<TestData>
      type TestRunner = QueryRunnerInterface<TestData, TestList, ExtendedParams>

      // モックランナーの実装例（型チェック用）
      const mockRunner: TestRunner = {
        async one(params?: ExtendedParams): Promise<TestData | null> {
          // 拡張プロパティが使用可能であることを確認
          if (params?.filter && !Array.isArray(params.filter)) {
            expect(params.filter.telephone).toBeDefined()
          }
          return null
        },
        
        async many(params?: ExtendedParams): Promise<TestList> {
          // 拡張プロパティが使用可能であることを確認
          if (params?.filter && !Array.isArray(params.filter)) {
            expect(params.filter['having:COUNT(*)']).toBeDefined()
          }
          return { items: [] }
        },
        
        async find(params: ExtendedParams): Promise<TestData> {
          // 必須パラメータでも拡張プロパティが使用可能
          if (!Array.isArray(params.filter) && params.filter) {
            expect(params.filter.custom_field).toBeDefined()
          }
          throw new Error('Not found')
        }
      }

      expect(mockRunner).toBeDefined()
    })
  })

  describe('エッジケース', () => {
    it('空のフィルターオブジェクトが正常動作する', () => {
      const filter: QueryFilter<TestData> = {}
      expect(filter).toEqual({})
    })

    it('nullまたはundefinedの値が正常処理される', () => {
      const filter: QueryFilter<TestData> = {
        name: { eq: null },
        age: { ne: null },
        custom_field: undefined
      }

      expect(filter.name).toEqual({ eq: null })
      expect(filter.age).toEqual({ ne: null })
      expect(filter.custom_field).toBeUndefined()
    })

    it('複雑なネストしたプロパティ名が処理可能', () => {
      const filter: QueryFilter<TestData> = {
        'deep.nested.property.with.dots': { eq: 'value' },
        'table_name.column_name': { in: [1, 2, 3] },
        'CASE WHEN x THEN y ELSE z END': { ne: null }
      }

      expect(filter['deep.nested.property.with.dots']).toEqual({ eq: 'value' })
      expect(filter['table_name.column_name']).toEqual({ in: [1, 2, 3] })
      expect(filter['CASE WHEN x THEN y ELSE z END']).toEqual({ ne: null })
    })
  })

  describe('後方互換性テスト', () => {
    it('既存のコードが変更なしで動作する', () => {
      // 既存の使用方法（変更前と同じ）
      const oldStyleFilter: QueryFilter<TestData> = {
        id: { eq: '123' },
        name: { contains: 'test' },
        age: { gte: 18 }
      }

      const oldStyleCriteria: QueryRunnerCriteria<TestData> = {
        filter: oldStyleFilter,
        orderBy: 'name:asc',
        take: 10
      }

      expect(oldStyleCriteria.filter).toBeDefined()
      expect(oldStyleCriteria.orderBy).toBe('name:asc')
      expect(oldStyleCriteria.take).toBe(10)
    })
  })
})