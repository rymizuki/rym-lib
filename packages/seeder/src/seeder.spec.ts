import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { Seeder } from './seeder'

// Mock PrismaClient
const mockPrismaClient = {
  $queryRawUnsafe: vi.fn(),
  $executeRawUnsafe: vi.fn(),
}

describe('Seeder', () => {
  let seeder: Seeder
  let consoleSpy: Mock

  beforeEach(() => {
    vi.clearAllMocks()
    consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
  })

  describe('機能: データベースレコードの追加・更新', () => {
    describe('ユースケース: 初期データをデータベースに投入する', () => {
      describe('シチュエーション: 新しいレコードが存在しない場合', () => {
        beforeEach(() => {
          seeder = new Seeder(mockPrismaClient as any, {})
          mockPrismaClient.$queryRawUnsafe.mockResolvedValue([]) // レコードが存在しない
        })

        it('結果: 新しいレコードを挿入する', async () => {
          await seeder.load('users', 'id', ['id', 'name'], [[1, 'test']])
          
          expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenCalledWith(
            'INSERT INTO `users` (`id`, `name`) VALUES ($1, $2)',
            1,
            'test'
          )
        })

        it('結果: 適切なINSERT SQLクエリを実行する', async () => {
          await seeder.load('users', 'id', ['id', 'name', 'email'], [[1, 'test', 'test@example.com']])
          
          expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenCalledWith(
            'INSERT INTO `users` (`id`, `name`, `email`) VALUES ($1, $2, $3)',
            1,
            'test',
            'test@example.com'
          )
        })
        
        describe('シチュエーション: created_atオプションが有効な場合', () => {
          beforeEach(() => {
            seeder = new Seeder(mockPrismaClient as any, { created_at: true })
          })

          it('結果: created_atカラムを設定する', async () => {
            const mockDate = new Date('2023-01-01T00:00:00Z')
            vi.spyOn(global, 'Date').mockImplementation(() => mockDate as any)

            await seeder.load('users', 'id', ['id', 'name'], [[1, 'test']])
            
            expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenCalledWith(
              'INSERT INTO `users` (`id`, `name`, `created_at`) VALUES ($1, $2, $3)',
              1,
              'test',
              mockDate
            )
          })
        })
        
        describe('シチュエーション: updated_atオプションが有効な場合', () => {
          beforeEach(() => {
            seeder = new Seeder(mockPrismaClient as any, { updated_at: true })
          })

          it('結果: updated_atカラムを設定する', async () => {
            const mockDate = new Date('2023-01-01T00:00:00Z')
            vi.spyOn(global, 'Date').mockImplementation(() => mockDate as any)

            await seeder.load('users', 'id', ['id', 'name'], [[1, 'test']])
            
            expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenCalledWith(
              'INSERT INTO `users` (`id`, `name`, `updated_at`) VALUES ($1, $2, $3)',
              1,
              'test',
              mockDate
            )
          })
        })
      })

      describe('シチュエーション: 既存のレコードが存在し、データが異なる場合', () => {
        beforeEach(() => {
          seeder = new Seeder(mockPrismaClient as any, {})
          mockPrismaClient.$queryRawUnsafe.mockResolvedValue([
            { id: 1, name: 'old_name', email: 'old@example.com' }
          ])
        })

        it('結果: 既存のレコードを更新する', async () => {
          await seeder.load('users', 'id', ['id', 'name', 'email'], [[1, 'new_name', 'new@example.com']])
          
          expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenCalledWith(
            'UPDATE `users` SET `name` = $1, `email` = $2 WHERE `id` = $3',
            'new_name',
            'new@example.com',
            1
          )
        })

        it('結果: 主キー以外のカラムのみを更新する', async () => {
          await seeder.load('users', 'id', ['id', 'name'], [[1, 'new_name']])
          
          expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenCalledWith(
            'UPDATE `users` SET `name` = $1 WHERE `id` = $2',
            'new_name',
            1
          )
        })

        it('結果: 適切なUPDATE SQLクエリを実行する', async () => {
          await seeder.load('users', 'id', ['id', 'name', 'email'], [[1, 'updated_name', 'updated@example.com']])
          
          expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenCalledWith(
            'UPDATE `users` SET `name` = $1, `email` = $2 WHERE `id` = $3',
            'updated_name',
            'updated@example.com',
            1
          )
        })
        
        describe('シチュエーション: updated_atオプションが有効な場合', () => {
          beforeEach(() => {
            seeder = new Seeder(mockPrismaClient as any, { updated_at: true })
          })

          it('結果: updated_atカラムを更新する', async () => {
            const mockDate = new Date('2023-01-01T00:00:00Z')
            vi.spyOn(global, 'Date').mockImplementation(() => mockDate as any)

            await seeder.load('users', 'id', ['id', 'name'], [[1, 'new_name']])
            
            expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenCalledWith(
              'UPDATE `users` SET `name` = $1, `updated_at` = $2 WHERE `id` = $3',
              'new_name',
              mockDate,
              1
            )
          })
        })
      })

      describe('シチュエーション: 既存のレコードが存在し、データが同じ場合', () => {
        beforeEach(() => {
          seeder = new Seeder(mockPrismaClient as any, {})
          mockPrismaClient.$queryRawUnsafe.mockResolvedValue([
            { id: 1, name: 'test', email: 'test@example.com' }
          ])
        })

        it('結果: 何も実行しない（スキップする）', async () => {
          await seeder.load('users', 'id', ['id', 'name', 'email'], [[1, 'test', 'test@example.com']])
          
          // UPDATEもINSERTも実行されない
          expect(mockPrismaClient.$executeRawUnsafe).not.toHaveBeenCalled()
        })
      })
    })

    describe('ユースケース: テストデータをセットアップする', () => {
      describe('シチュエーション: 複数のテーブルに対してデータを投入する', () => {
        beforeEach(() => {
          seeder = new Seeder(mockPrismaClient as any, {})
          mockPrismaClient.$queryRawUnsafe.mockResolvedValue([])
        })

        it('結果: 各テーブルに対して順次データを投入する', async () => {
          await seeder.load('users', 'id', ['id', 'name'], [[1, 'user1']])
          await seeder.load('posts', 'id', ['id', 'title'], [[1, 'post1']])
          
          expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenNthCalledWith(1,
            'INSERT INTO `users` (`id`, `name`) VALUES ($1, $2)',
            1, 'user1'
          )
          expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenNthCalledWith(2,
            'INSERT INTO `posts` (`id`, `title`) VALUES ($1, $2)',
            1, 'post1'
          )
        })

        it('結果: 各テーブルの処理完了後にログを出力する', async () => {
          await seeder.load('users', 'id', ['id', 'name'], [[1, 'user1']])
          
          expect(consoleSpy).toHaveBeenCalledWith('loading "users" done.')
        })
      })

      describe('シチュエーション: 複数のレコードを一度に処理する', () => {
        beforeEach(() => {
          seeder = new Seeder(mockPrismaClient as any, {})
          mockPrismaClient.$queryRawUnsafe.mockResolvedValue([])
        })

        it('結果: 各レコードに対して挿入または更新を実行する', async () => {
          await seeder.load('users', 'id', ['id', 'name'], [
            [1, 'user1'],
            [2, 'user2'],
            [3, 'user3']
          ])
          
          expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenCalledTimes(3)
          expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenNthCalledWith(1,
            'INSERT INTO `users` (`id`, `name`) VALUES ($1, $2)',
            1, 'user1'
          )
          expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenNthCalledWith(2,
            'INSERT INTO `users` (`id`, `name`) VALUES ($1, $2)',
            2, 'user2'
          )
          expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenNthCalledWith(3,
            'INSERT INTO `users` (`id`, `name`) VALUES ($1, $2)',
            3, 'user3'
          )
        })

        it('結果: 処理順序を保持する', async () => {
          const records = [[1, 'first'], [2, 'second'], [3, 'third']]
          await seeder.load('users', 'id', ['id', 'name'], records)
          
          // 順序通りに呼び出されることを確認
          expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenNthCalledWith(1,
            expect.any(String), 1, 'first'
          )
          expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenNthCalledWith(2,
            expect.any(String), 2, 'second'
          )
          expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenNthCalledWith(3,
            expect.any(String), 3, 'third'
          )
        })
      })
    })

    describe.todo('ユースケース: マイグレーション時の初期データ投入', () => {
      describe.todo('シチュエーション: プロダクション環境での初期データ投入', () => {
        it.todo('結果: 既存データを保護しつつ新しいデータを投入する')
        // ERROR: この項目は実装時に複雑なデータ同期ロジックが必要
        it.todo('結果: データの一貫性を保つ')
        // ERROR: トランザクション管理とロールバック機能が必要
      })
    })
  })

  describe('機能: 設定オプションの処理', () => {
    describe('ユースケース: データベース固有の設定を適用する', () => {
      describe('シチュエーション: quoteオプションでカラム名をエスケープする', () => {
        beforeEach(() => {
          mockPrismaClient.$queryRawUnsafe.mockResolvedValue([])
        })

        describe('シチュエーション: デフォルトの場合', () => {
          beforeEach(() => {
            seeder = new Seeder(mockPrismaClient as any, {})
          })

          it('結果: バッククオート(`)を使用する', async () => {
            await seeder.load('users', 'id', ['id', 'name'], [[1, 'test']])
            
            expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenCalledWith(
              'INSERT INTO `users` (`id`, `name`) VALUES ($1, $2)',
              1, 'test'
            )
          })
        })
        
        describe('シチュエーション: ダブルクオート(")を指定した場合', () => {
          beforeEach(() => {
            seeder = new Seeder(mockPrismaClient as any, { quote: '"' })
          })

          it('結果: ダブルクオートを使用する', async () => {
            await seeder.load('users', 'id', ['id', 'name'], [[1, 'test']])
            
            expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenCalledWith(
              'INSERT INTO "users" ("id", "name") VALUES ($1, $2)',
              1, 'test'
            )
          })
        })
        
        describe('シチュエーション: シングルクオート(\')を指定した場合', () => {
          beforeEach(() => {
            seeder = new Seeder(mockPrismaClient as any, { quote: '\'' })
          })

          it('結果: シングルクオートを使用する', async () => {
            await seeder.load('users', 'id', ['id', 'name'], [[1, 'test']])
            
            expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenCalledWith(
              'INSERT INTO \'users\' (\'id\', \'name\') VALUES ($1, $2)',
              1, 'test'
            )
          })
        })
        
        describe('シチュエーション: 空文字を指定した場合', () => {
          beforeEach(() => {
            seeder = new Seeder(mockPrismaClient as any, { quote: '' })
          })

          it('結果: クオートなしでエスケープする', async () => {
            await seeder.load('users', 'id', ['id', 'name'], [[1, 'test']])
            
            expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenCalledWith(
              'INSERT INTO users (id, name) VALUES ($1, $2)',
              1, 'test'
            )
          })
        })
      })

      describe('シチュエーション: タイムスタンプカラムの自動設定', () => {
        beforeEach(() => {
          mockPrismaClient.$queryRawUnsafe.mockResolvedValue([])
        })

        describe('シチュエーション: created_atオプションがtrueの場合', () => {
          beforeEach(() => {
            seeder = new Seeder(mockPrismaClient as any, { created_at: true })
          })

          it('結果: INSERT時にcreated_atを設定する', async () => {
            const mockDate = new Date('2023-01-01T00:00:00Z')
            vi.spyOn(global, 'Date').mockImplementation(() => mockDate as any)

            await seeder.load('users', 'id', ['id', 'name'], [[1, 'test']])
            
            expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenCalledWith(
              'INSERT INTO `users` (`id`, `name`, `created_at`) VALUES ($1, $2, $3)',
              1, 'test', mockDate
            )
          })
        })
        
        describe('シチュエーション: updated_atオプションがtrueの場合', () => {
          beforeEach(() => {
            seeder = new Seeder(mockPrismaClient as any, { updated_at: true })
          })

          it('結果: INSERT/UPDATE時にupdated_atを設定する', async () => {
            const mockDate = new Date('2023-01-01T00:00:00Z')
            vi.spyOn(global, 'Date').mockImplementation(() => mockDate as any)

            // INSERT時
            await seeder.load('users', 'id', ['id', 'name'], [[1, 'test']])
            
            expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenCalledWith(
              'INSERT INTO `users` (`id`, `name`, `updated_at`) VALUES ($1, $2, $3)',
              1, 'test', mockDate
            )
          })
        })
        
        describe('シチュエーション: タイムスタンプオプションがfalseの場合', () => {
          beforeEach(() => {
            seeder = new Seeder(mockPrismaClient as any, { created_at: false, updated_at: false })
          })

          it('結果: 自動設定しない', async () => {
            await seeder.load('users', 'id', ['id', 'name'], [[1, 'test']])
            
            expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenCalledWith(
              'INSERT INTO `users` (`id`, `name`) VALUES ($1, $2)',
              1, 'test'
            )
          })
        })
      })
    })
  })

  describe('機能: エラーハンドリング', () => {
    describe('ユースケース: 不正なデータでエラーが発生する', () => {
      describe('シチュエーション: 主キーがカラムリストに存在しない', () => {
        beforeEach(() => {
          seeder = new Seeder(mockPrismaClient as any, {})
        })

        it('結果: エラーメッセージと共に例外を投げる', async () => {
          await expect(
            seeder.load('users', 'id', ['name', 'email'], [[1, 'test', 'test@example.com']])
          ).rejects.toThrow()
        })

        it('結果: エラーメッセージにテーブル名、主キー名、カラムリストを含める', async () => {
          await expect(
            seeder.load('users', 'id', ['name', 'email'], [[1, 'test', 'test@example.com']])
          ).rejects.toThrow('Seeder error: table(users) pk(id) missing in (name, email)')
        })
      })

      describe('シチュエーション: SQLクエリ実行時にエラーが発生する', () => {
        let consoleInfoSpy: Mock

        beforeEach(() => {
          seeder = new Seeder(mockPrismaClient as any, {})
          mockPrismaClient.$queryRawUnsafe.mockResolvedValue([])
          consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
          
          const sqlError = new Error('SQL execution failed')
          mockPrismaClient.$executeRawUnsafe.mockRejectedValue(sqlError)
        })

        it('結果: エラー情報をコンソールに出力する', async () => {
          await expect(
            seeder.load('users', 'id', ['id', 'name'], [[1, 'test']])
          ).rejects.toThrow('SQL execution failed')
          
          expect(consoleInfoSpy).toHaveBeenCalled()
        })

        it('結果: SQL文と値をログに含める', async () => {
          await expect(
            seeder.load('users', 'id', ['id', 'name'], [[1, 'test']])
          ).rejects.toThrow()
          
          expect(consoleInfoSpy).toHaveBeenCalledWith({
            sql: 'INSERT INTO `users` (`id`, `name`) VALUES ($1, $2)',
            values: [1, 'test']
          })
        })

        it('結果: 元のエラーを再投げする', async () => {
          const originalError = new Error('Original SQL error')
          mockPrismaClient.$executeRawUnsafe.mockRejectedValue(originalError)
          
          await expect(
            seeder.load('users', 'id', ['id', 'name'], [[1, 'test']])
          ).rejects.toThrow('Original SQL error')
        })
      })
    })

    describe('ユースケース: データベース接続エラーが発生する', () => {
      describe('シチュエーション: PrismaClientでエラーが発生する', () => {
        beforeEach(() => {
          seeder = new Seeder(mockPrismaClient as any, {})
        })

        it('結果: エラーを適切に伝播する', async () => {
          const connectionError = new Error('Database connection failed')
          mockPrismaClient.$queryRawUnsafe.mockRejectedValue(connectionError)
          
          await expect(
            seeder.load('users', 'id', ['id', 'name'], [[1, 'test']])
          ).rejects.toThrow('Database connection failed')
        })
      })
    })
  })

  describe('機能: SQLクエリ生成', () => {
    describe('ユースケース: 動的なSQLクエリを生成する', () => {
      describe('シチュエーション: INSERT文を生成する', () => {
        beforeEach(() => {
          seeder = new Seeder(mockPrismaClient as any, {})
          mockPrismaClient.$queryRawUnsafe.mockResolvedValue([])
        })

        it('結果: カラム名とプレースホルダーを含む正しいINSERT文を生成する', async () => {
          await seeder.load('users', 'id', ['id', 'name', 'email'], [[1, 'test', 'test@example.com']])
          
          expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenCalledWith(
            'INSERT INTO `users` (`id`, `name`, `email`) VALUES ($1, $2, $3)',
            1, 'test', 'test@example.com'
          )
        })
        
        describe('シチュエーション: タイムスタンプカラムが有効な場合', () => {
          beforeEach(() => {
            seeder = new Seeder(mockPrismaClient as any, { created_at: true, updated_at: true })
          })

          it('結果: タイムスタンプカラムも含める', async () => {
            const mockDate = new Date('2023-01-01T00:00:00Z')
            vi.spyOn(global, 'Date').mockImplementation(() => mockDate as any)

            await seeder.load('users', 'id', ['id', 'name'], [[1, 'test']])
            
            expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenCalledWith(
              'INSERT INTO `users` (`id`, `name`, `created_at`, `updated_at`) VALUES ($1, $2, $3, $4)',
              1, 'test', mockDate, mockDate
            )
          })
        })
      })

      describe('シチュエーション: UPDATE文を生成する', () => {
        beforeEach(() => {
          seeder = new Seeder(mockPrismaClient as any, {})
          mockPrismaClient.$queryRawUnsafe.mockResolvedValue([
            { id: 1, name: 'old_name', email: 'old@example.com' }
          ])
        })

        it('結果: 主キー以外のカラムのSET句を生成する', async () => {
          await seeder.load('users', 'id', ['id', 'name', 'email'], [[1, 'new_name', 'new@example.com']])
          
          expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenCalledWith(
            'UPDATE `users` SET `name` = $1, `email` = $2 WHERE `id` = $3',
            'new_name', 'new@example.com', 1
          )
        })

        it('結果: WHERE句で主キーを指定する', async () => {
          await seeder.load('users', 'id', ['id', 'name'], [[1, 'updated_name']])
          
          expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenCalledWith(
            expect.stringContaining('WHERE `id` = $2'),
            'updated_name', 1
          )
        })
        
        describe('シチュエーション: タイムスタンプカラムが有効な場合', () => {
          beforeEach(() => {
            seeder = new Seeder(mockPrismaClient as any, { updated_at: true })
          })

          it('結果: updated_atも含める', async () => {
            const mockDate = new Date('2023-01-01T00:00:00Z')
            vi.spyOn(global, 'Date').mockImplementation(() => mockDate as any)

            await seeder.load('users', 'id', ['id', 'name'], [[1, 'updated_name']])
            
            expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenCalledWith(
              'UPDATE `users` SET `name` = $1, `updated_at` = $2 WHERE `id` = $3',
              'updated_name', mockDate, 1
            )
          })
        })
      })

      describe('シチュエーション: SELECT文を生成する', () => {
        beforeEach(() => {
          seeder = new Seeder(mockPrismaClient as any, {})
        })

        it('結果: 主キーでの検索条件を含む正しいSELECT文を生成する', async () => {
          mockPrismaClient.$queryRawUnsafe.mockResolvedValue([])
          
          await seeder.load('users', 'id', ['id', 'name'], [[1, 'test']])
          
          expect(mockPrismaClient.$queryRawUnsafe).toHaveBeenCalledWith(
            'SELECT * FROM `users` WHERE `id` = $1 LIMIT 1',
            1
          )
        })
      })
    })
  })
})