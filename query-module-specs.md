# query-module関連パッケージ仕様書

## 概要

query-module関連パッケージは、データベースクエリの抽象化と標準化を提供するパッケージ群です。異なるORM/データベースドライバーに対して統一されたインターフェースを提供し、クエリ実行のミドルウェア機能も含みます。

## パッケージ構成

- `@rym-lib/query-module`: コアモジュール
- `@rym-lib/query-module-driver-sequelize`: Sequelize用ドライバー
- `@rym-lib/query-module-driver-prisma`: Prisma用ドライバー
- `@rym-lib/query-module-sql-builder`: SQL構築ユーティリティ

---

## 1. @rym-lib/query-module

### ユースケース

- データベースクエリの抽象化レイヤーとして機能
- 異なるデータベースドライバーに対する統一インターフェース提供
- クエリ実行前後のミドルウェア処理
- 型安全なクエリ結果の取得

### 条件

- `QueryDriverInterface`を実装したドライバーが必要
- `QuerySpecification`でクエリの仕様を定義
- オプションで`QueryRunnerMiddleware`を設定可能

### QuerySpecification詳細仕様

`QuerySpecification`は、クエリの実行仕様を定義するインターフェースです。

```typescript
interface QuerySpecification<
  Data extends QueryResultData,
  Driver extends QueryDriverInterface,
  List extends QueryResultList<Data> = QueryResultList<Data>,
  Params extends QueryRunnerCriteria<Data> = QueryRunnerCriteria<Data>
> {
  name?: string
  source: QuerySourceInterface<Data, Driver>
  rules: Partial<Record<keyof NonNullable<Params['filter']> | string, string>>
  criteria?: (params: Partial<Params>) => Partial<Params>
  middlewares?: QueryRunnerMiddleware<Data, List, Params>[]
}
```

#### プロパティ詳細

**name (オプション)**
- 型: `string`
- 用途: クエリの名前（デバッグ・ログ出力で使用）
- エラー時の識別に使用

**source (必須)**
- 型: `QuerySourceInterface<Data, Driver>`
- 用途: SQLクエリ構築関数を定義
- ドライバーのsource()メソッドに渡される関数
- 例: `(builder) => builder.from('users').select('*')`

**rules (必須)**
- 型: `Partial<Record<keyof NonNullable<Params['filter']> | string, string>>`
- 用途: フィルタープロパティとカラムのマッピング定義
- 将来的な機能拡張のためのプレースホルダー（現在は空オブジェクト`{}`で良い）

**criteria (オプション)**
- 型: `(params: Partial<Params>) => Partial<Params>`
- 用途: クエリ実行前にパラメータを変換・拡張する関数
- 例: デフォルト値設定、パラメータの正規化など

**middlewares (オプション)**
- 型: `QueryRunnerMiddleware<Data, List, Params>[]`
- 用途: クエリ実行前後の処理を定義

#### QueryRunnerMiddleware仕様

```typescript
interface QueryRunnerMiddleware<Data, List, Params> {
  preprocess?: (
    criteria: Partial<Params>,
    context: QueryRunnerMiddlewareContext<Data, List, Params>
  ) => void | Promise<void>
  
  postprocess?: (
    result: List,
    criteria: Partial<Params>, 
    context: QueryRunnerMiddlewareContext<Data, List, Params>
  ) => void | Promise<void>
}
```

**preprocess**
- 実行タイミング: クエリ実行前
- 用途: パラメータの検証・変換、ログ出力など
- criteria: クエリパラメータ（変更可能）

**postprocess**
- 実行タイミング: クエリ実行後
- 用途: 結果データの変換・拡張、キャッシュ処理など
- result: クエリ結果（変更可能）
- 実行順序: middlewares配列の逆順で実行

#### 使用例

```typescript
const userQuery: QuerySpecification<UserData, Driver> = {
  name: 'findActiveUsers',
  source: (builder) => builder
    .from('users')
    .select(['id', 'name', 'email'])
    .where('deleted_at', 'IS', null),
  rules: {},
  criteria: (params) => ({
    ...params,
    filter: {
      status: 'active',
      ...params.filter
    }
  }),
  middlewares: [
    {
      preprocess: (criteria, context) => {
        context.logger.info('Executing user query', criteria)
      },
      postprocess: (result, criteria, context) => {
        context.logger.info(`Found ${result.items.length} users`)
      }
    }
  ]
}
```

### 期待結果

**QueryRunner.one()**
- 入力: `QueryRunnerCriteria`（オプション）
- 出力: `Data | null`
- 動作: 最大1件のレコードを取得、見つからない場合はnullを返す

**QueryRunner.many()**
- 入力: `QueryRunnerCriteria`（オプション）
- 出力: `QueryResultList<Data>`
- 動作: 複数のレコードを取得、ミドルウェア前後処理を含む

**QueryRunner.find()**
- 入力: `QueryRunnerCriteria`
- 出力: `Data`
- 動作: 1件のレコードを取得、見つからない場合は`QueryRunnerResourceNotFoundException`をスロー

---

## 2. @rym-lib/query-module-driver-sequelize

### ユースケース

- Sequelize ORM用のQueryDriverInterface実装
- Raw SQLクエリの実行
- SQLクエリビルダーとの連携

### 条件

- Sequelizeインスタンスが必要
- `@rym-lib/query-module-sql-builder`に依存
- `QueryLoggerInterface`の実装が必要

### 期待結果

**QueryDriverSequelize.source()**
- 入力: `(builder: SQLBuilderPort) => SQLBuilderPort`
- 出力: `QueryDriverSequelize`（チェーン可能）
- 動作: SQLクエリ構築の設定を保存

**QueryDriverSequelize.execute()**
- 入力: `QueryCriteriaInterface`
- 出力: `Promise<Record<string, any>[]>`
- 動作: 
  1. SQLクエリビルダーでSQL文とパラメータを生成
  2. SequelizeでRaw SQLクエリを実行
  3. 結果をRecord配列として返却

---

## 3. @rym-lib/query-module-driver-prisma

### ユースケース

- Prisma ORM用のQueryDriverInterface実装
- Raw SQLクエリの実行
- SQLクエリビルダーとの連携

### 条件

- PrismaClientインスタンスが必要
- `@rym-lib/query-module-sql-builder`に依存
- `QueryLoggerInterface`の実装が必要

### 期待結果

**QueryDriverPrisma.source()**
- 入力: `(builder: SQLBuilderPort) => SQLBuilderPort`
- 出力: `QueryDriverPrisma`（チェーン可能）
- 動作: SQLクエリ構築の設定を保存

**QueryDriverPrisma.execute()**
- 入力: `QueryCriteriaInterface<D>`
- 出力: `Promise<Record<string, any>[]>`
- 動作:
  1. SQLクエリビルダーでSQL文とパラメータを生成
  2. PrismaClientの`$queryRawUnsafe`でRaw SQLクエリを実行
  3. 結果をRecord配列として返却

---

## 4. @rym-lib/query-module-sql-builder

### ユースケース

- QueryCriteriaからSQL文の構築
- フィルタリング条件の処理
- ソート、ページネーション処理
- coral-sqlライブラリのラッパー機能

### 条件

- `coral-sql`パッケージに依存
- `SQLBuilderPort`インスタンスが必要
- `QueryCriteriaInterface`の条件設定

### 期待結果

**buildSQL()**
- 入力: 
  - `builder: SQLBuilderPort`
  - `criteria: QueryCriteriaInterface`
  - `options: Partial<BuildSqlOptions>`（オプション）
- 出力: `[sql: string, replacements: any[]]`
- 動作:
  1. `criteria.filter`からWHERE句とHAVING句を構築
  2. `criteria.orderBy`からORDER BY句を構築
  3. `criteria.take`からLIMIT句を構築
  4. `criteria.skip`からOFFSET句を構築
  5. 完成したSQL文とパラメータの配列を返却

**フィルタ処理**
- 通常のフィルタ: WHERE句に変換
- `having:`プレフィックス付きフィルタ: HAVING句に変換
- 複数フィルタ: OR条件で結合

**ソート処理**
- `columnName:asc` または `columnName:desc` 形式
- 複数のソート条件をサポート

**ページネーション**
- `take`: LIMIT句として処理
- `skip`: OFFSET句として処理

---

## 使用例

```typescript
// 1. ドライバー初期化
const driver = new QueryDriverSequelize(sequelize, { logger });

// 2. クエリ定義
const userQuery = defineQuery({
  name: 'findUsers',
  source: (builder) => builder.from('users').select('*'),
  rules: {},
});

// 3. クエリ実行
const runner = new QueryRunner(driver, userQuery, { logger });
const users = await runner.many({ 
  filter: { status: 'active' },
  orderBy: 'created_at:desc',
  take: 10 
});
```