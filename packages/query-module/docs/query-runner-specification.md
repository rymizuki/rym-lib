# QueryRunner 完全仕様書

## 概要

`QueryRunner`は、データの検索・取得を行うためのインターフェースを提供するコンポーネントです。型安全なクエリ実行、柔軟なフィルタリング、ソート、ページネーション機能を統合的に提供します。

## 基本データ型

```typescript
type TestData = {
  id: number
  name: string
  status: 'active' | 'inactive'
  email: string | null
  metadata?: {
    tags: string[]
    priority: number
  }
}
```

## インターフェース定義

`QueryRunnerInterface<TestData>`は以下の3つのメソッドを提供します：

- `one(params?: Partial<QueryRunnerCriteria<TestData>>): Promise<TestData | null>`
- `many(params?: Partial<QueryRunnerCriteria<TestData>>): Promise<QueryResultList<TestData>>`
- `find(params: QueryRunnerCriteria<TestData>): Promise<TestData>`

---

## 1. コンストラクタ仕様

### 1.1 正常なインスタンス作成

**有効なパラメータが提供された場合：**

- ✅ `QueryRunnerInterface<TestData>`インスタンスを正常に作成する
- ✅ `one()`, `many()`, `find()`メソッドの実行準備が完了する
- ✅ `QueryRunnerInterface`契約を正しく実装する

### 1.2 異常なパラメータ処理

**null/undefinedパラメータが提供された場合：**

- ⚠️ `TypeError`をスローして`QueryRunnerInterface`作成を防ぐ
- ⚠️ 無効なパラメータに対して意味のあるエラーメッセージを提供する

---

## 2. one()メソッド仕様

**シグネチャ:** `one(params?: Partial<QueryRunnerCriteria<TestData>>): Promise<TestData | null>`

### 2.1 基本動作

#### パラメータなし実行
```typescript
await runner.one()
```

**データソースに複数のTestDataレコードが存在する場合：**
- ✅ `Promise<TestData | null>`で最初のTestDataレコードを解決する
- ✅ 必要なプロパティを全て含むTestDataを返す
- ✅ 元のparamsオブジェクトを変更しない

**データソースが空の場合：**
- ✅ `Promise<TestData | null>`で`null`を解決する
- ✅ ErrorやExceptionをスローしない

### 2.2 フィルタリング機能

#### 基本フィルター
```typescript
await runner.one({filter: {id: {eq: 2}}})
```

**マッチするレコードが存在する場合：**
- ✅ `Promise<TestData | null>`で`id: 2`のTestDataを解決する
- ✅ `QueryFilter<TestData>`を正しく適用する
- ✅ `QuerySpecification`のプロパティマッピングルールを尊重する

**マッチするレコードが存在しない場合：**
- ✅ `Promise<TestData | null>`で`null`を解決する
- ✅ `QueryRunnerResourceNotFoundException`をスローしない

### 2.3 ソート機能

#### 単一フィールドソート
```typescript
await runner.one({orderBy: "name:desc"})
```

- ✅ `Promise<TestData | null>`で降順nameソートの最初のTestDataを解決する
- ✅ `orderBy: "name:asc"`を正しく処理する
- ✅ `orderBy: ["name:desc", "id:asc"]`を正しく処理する
- ✅ `orderBy: "metadata.priority:desc"`を正しく処理する

### 2.4 ページネーション

#### スキップ機能
```typescript
await runner.one({skip: 5})
```

- ✅ `Promise<TestData | null>`で5レコードをスキップした後のTestDataを解決する
- ✅ `skip: 999`が結果セット長を超える場合は`null`を返す

#### 取得件数制限
```typescript
await runner.one({take: 10})
```

- ✅ `Promise<TestData | null>`で単一TestDataを解決する（実質的に`take: 1`）
- ✅ take値に関係なく一貫した動作を保つ（インターフェース契約）

### 2.5 ミドルウェア対応

**QuerySpecificationにミドルウェアが含まれる場合：**
- ✅ `Promise<TestData | null>`でミドルウェア効果が適用された結果を返す
- ✅ 最終結果にミドルウェア変更を反映する
- ✅ ミドルウェア処理が失敗した場合Promiseをrejectする

### 2.6 エラーハンドリング

- ⚠️ データソース操作が失敗した場合Promiseをrejectする
- ⚠️ ミドルウェア操作が失敗した場合Promiseをrejectする
- ⚠️ 意味のあるエラーメッセージを提供する

---

## 3. many()メソッド仕様

**シグネチャ:** `many(params?: Partial<QueryRunnerCriteria<TestData>>): Promise<QueryResultList<TestData>>`

### 3.1 基本動作

#### パラメータなし実行
```typescript
await runner.many()
```

**データソースにTestDataレコードが含まれる場合：**
- ✅ `Promise<QueryResultList<TestData>>`で全レコードを返す
- ✅ `result.items`として`TestData[]`を返す
- ✅ デフォルトで空のフィルタ条件を適用する

**データソースが空の場合：**
- ✅ `Promise<QueryResultList<TestData>>`で`{items: []}`を解決する
- ✅ `QueryResultList<TestData>`構造を維持する

### 3.2 フィルタリング機能

#### 単一QueryFilterOperator条件
```typescript
// 各オペレータのサポート
{name: {eq: "john"}}          // eq演算子
{name: {ne: "jane"}}          // ne演算子
{id: {gt: 10, lt: 20}}        // gt/lt演算子
{name: {contains: "test"}}    // contains演算子
{status: {in: ["active", "pending"]}}  // in演算子
{email: {eq: null}}           // null値
```

#### 複数フィルタ条件
```typescript
// AND条件（オブジェクト形式）
{name: {eq: "john"}, status: {eq: "active"}}

// OR条件（配列形式）
[{name: {eq: "john"}}, {status: {eq: "active"}}]

// 複雑なネスト条件
[{name: {contains: "test"}, id: {gt: 1}}, {status: {in: ["active"]}}]
```

#### プロパティマッピングによるフィルター
```typescript
// spec.rulesを使用したマッピング
spec.rules: {name: "user_name", id: "user_id"}

// ドット記法のマッピング
spec.rules: {"metadata.priority": "priority_score"}
```

- ✅ `spec.rules`を使用してフィルターキーをマッピングする
- ✅ ドット記法マッピングを処理する
- ✅ `spec.rules`にないキーは元のまま保持する

### 3.3 ソート機能

#### 単一フィールドソート
```typescript
{orderBy: "name:asc"}         // 昇順
{orderBy: "name:desc"}        // 降順
{orderBy: "name"}             // デフォルト方向
```

#### 複数フィールドソート
```typescript
{orderBy: ["name:asc", "id:desc"]}
{orderBy: ["status:desc", "name:asc", "id:desc"]}
```

#### プロパティマッピングによるソート
```typescript
// spec.rulesを使用したorderByフィールドマッピング
{orderBy: "metadata.priority:desc"}  // ドット記法マッピング
```

### 3.4 ページネーション

#### skip（スキップ）パラメータ
```typescript
{skip: 10}    // 10レコードをスキップ
{skip: 0}     // スキップなし
{skip: 999}   // 結果セットより大きい値
```

#### take（取得件数）パラメータ
```typescript
{take: 5}     // 5レコードに制限
{take: 0}     // 空の結果を返す
{take: 999}   // 結果セットより大きい値
```

#### skip と take の組み合わせ
```typescript
// ページネーション
{skip: 10, take: 5}

// フィルター + ソート + ページネーション
{
  filter: {status: {eq: "active"}}, 
  skip: 2, 
  take: 3, 
  orderBy: "name:asc"
}
```

### 3.5 ミドルウェア対応

#### ミドルウェア効果の結果への適用
- ✅ `QueryResultList<TestData>`でpreprocessミドルウェア条件変更が適用された結果を返す
- ✅ `QueryResultList<TestData>`でpostprocessミドルウェア結果変更が適用された結果を返す
- ✅ 非同期ミドルウェア操作を透過的に処理する

#### 複数ミドルウェア
- ✅ `QueryResultList<TestData>`で全ミドルウェア効果が適用された結果を返す
- ✅ 一貫した`Promise<QueryResultList<TestData>>`動作を維持する

#### ミドルウェアエラーハンドリング
- ⚠️ ミドルウェア処理が失敗した場合`Promise<QueryResultList<TestData>>`をrejectする
- ⚠️ rejectで意味のあるエラー情報を提供する

### 3.6 プロパティマッピングルール

#### 基本マッピング
- ✅ 単純なプロパティ名をマッピングする
- ✅ マッピングされていないプロパティを処理する
- ✅ マッピングが存在しない場合は元のプロパティ名を保持する

#### ドット記法マッピング
- ✅ ソースキーでドット記法を処理する
- ✅ ターゲットキーでドット記法を処理する
- ✅ ネストオブジェクトマッピングを処理する

#### 複雑なマッピングシナリオ
- ✅ 部分マッピングを処理する
- ✅ 競合するマッピングを処理する
- ✅ 大文字小文字を区別するマッピングを処理する

### 3.7 条件変換

#### QuerySpecification.criteria関数が提供された場合
- ✅ パラメータに条件変換を適用する
- ✅ 変換された条件で`Promise<QueryResultList<TestData>>`を返す
- ✅ 条件変換エラーを適切に処理する

#### 条件関数が提供されていない場合
- ✅ 変換なしでパラメータを直接使用する
- ✅ 元のparamsオブジェクトを変更しない

### 3.8 データソース実行

#### ソース操作
- ✅ 適切な条件で`QuerySpecification.source`を実行する
- ✅ ソース結果で`Promise<QueryResultList<TestData>>`を返す
- ✅ データソースエラーを適切に処理する

#### 結果構造
- ✅ itemsプロパティを持つ`QueryResultList<TestData>`を返す
- ✅ `result.items`に`TestData[]`を含むことを保証する
- ✅ 空の結果を正しく処理する

---

## 4. find()メソッド仕様

**シグネチャ:** `find(params: QueryRunnerCriteria<TestData>): Promise<TestData>`

### 4.1 基本動作

#### マッチするTestDataが存在する場合
```typescript
await runner.find({filter: {id: {eq: 1}}})
```

- ✅ `Promise<TestData>`でマッチするTestDataを解決する
- ✅ 単一レコード取得のための`QueryRunnerInterface`契約を適用する
- ✅ 絶対に`null`を返さない（代わりに例外をスロー）

#### マッチするレコードが存在しない場合
- ⚠️ `QueryRunnerResourceNotFoundException`で`Promise`をrejectする
- ⚠️ 例外メッセージに`QuerySpecification.name`を含める
- ⚠️ 例外メッセージに検索条件を含める

#### 複数のマッチするTestDataが存在する場合
- ✅ `Promise<TestData>`で最初にマッチするTestDataを解決する
- ✅ 「最初」のレコードを決定するためにorderByを尊重する

### 4.2 複雑な検索条件

#### 複合条件での検索
```typescript
await runner.find({
  filter: {status: {eq: "active"}}, 
  orderBy: "name:desc", 
  skip: 2
})
```

- ✅ 全条件を適用して`Promise<TestData>`を返す
- ✅ `QueryFilter<TestData>`フィルタリングルールを尊重する
- ✅ ソートとページネーションパラメータを尊重する
- ✅ `QuerySpecification.rules`プロパティマッピングを尊重する

### 4.3 エラーハンドリング

- ⚠️ データ取得が失敗した場合Promiseをrejectする
- ⚠️ マッチしない場合`QueryRunnerResourceNotFoundException`でPromiseをrejectする
- ⚠️ 意味のあるエラー情報を提供する

---

## 5. 統合シナリオ

### 5.1 複雑なデータ構造での利用

#### ネストオブジェクト
```typescript
// メタデータ内のpriorityでフィルター
{filter: {"metadata.priority": {gt: 5}}}
```

- ✅ ネストオブジェクトクエリを処理する
- ✅ ドット記法アクセスをサポートする
- ✅ 深いネストを処理する

#### 配列プロパティ
```typescript
// tagsの長さや内容でフィルター
{filter: {"metadata.tags": {contains: "important"}}}
```

- ✅ 配列プロパティクエリを処理する
- ✅ 配列要素アクセスをサポートする
- ✅ 配列長クエリを処理する

### 5.2 パフォーマンス考慮事項

#### 大規模結果セット（>10,000 TestDataレコード）
- ⚡ `Promise<QueryResultList<TestData>>`を1000ms以内に返す
- ⚡ ページネーション（`skip: 1000, take: 100`）でパフォーマンス劣化しない
- ⚡ データセット全体ではなく、要求されたTestDataレコードのみ返す

#### 複雑なクエリ（5+フィルタ条件 + ソート）
- ⚡ 複雑なフィルターに対して500ms以内で`Promise<QueryResultList<TestData>>`を返す
- ⚡ ブロックなしで10+の同時クエリ実行を処理する
- ⚡ クエリの複雑さに関係なく一貫した応答時間を維持する

### 5.3 実用的な使用パターン

#### 検索とページネーション
```typescript
// nameに"user"を含む、20-29番目の10件
await runner.many({
  filter: {name: {contains: "user"}}, 
  skip: 20, 
  take: 10
})
```

- ✅ `Promise<QueryResultList<TestData>>`で正確に10件以下のマッチするレコードを返す
- ✅ スキップオフセット後にマッチがない場合`{items: []}`を返す
- ✅ ページネーション結果全体で一貫したソート順序を維持する

#### 複雑なフィルタリングとソート
```typescript
await runner.many({
  filter: {
    status: {in: ["active"]}, 
    name: {contains: "admin"}
  }, 
  orderBy: "name:asc"
})
```

- ✅ `Promise<QueryResultList<TestData>>`でフィルターされソートされた結果を返す
- ✅ 同一クエリを複数回実行しても一貫した結果を返す
- ✅ 境界条件（空フィルター、マッチなし）を適切に処理する

---

## 6. エッジケースと境界条件

### 6.1 パラメータエッジケース

- ✅ `params: undefined`を`{}`として処理する
- ✅ `params: null`を`{}`として処理する
- ✅ `params: {}`を空の条件として処理する
- ⚠️ 無効な型のparams（`filter: "string"`など）を処理する

### 6.2 データエッジケース

- ✅ nullプロパティを持つTestDataを処理する
- ✅ undefinedプロパティを持つTestDataを処理する
- ⚠️ 必要フィールドが欠如している不正なTestDataを処理する

### 6.3 spec.rulesマッピングエッジケース

- ⚠️ rulesマッピングでの循環参照を処理する
- ⚠️ 存在しないターゲットフィールドを指すrulesを処理する
- ⚠️ 無効なrules（`{key: null, key2: undefined}`）を処理する

---

## 7. 型安全性とジェネリクス

### 7.1 ジェネリック型パラメータ

- ✅ `QueryRunner<TestData, Driver, List, Params>`でTestData型を維持する
- ✅ `QueryResultList<TestData>`型制約を尊重する
- ✅ `QueryRunnerCriteria<TestData>`型使用を検証する

### 7.2 型推論

- ✅ `one()`メソッドで`Promise<TestData | null>`を推論する
- ✅ `many()`メソッドで`Promise<QueryResultList<TestData>>`を推論する
- ✅ `find()`メソッドで`Promise<TestData>`を推論する
- ✅ `params?: Partial<QueryRunnerCriteria<TestData>>`で適切な型チェックを提供する

---

## 8. 並行処理と非同期動作

### 8.1 非同期操作

- ✅ 同時の`await runner.one()`呼び出しを処理する
- ✅ 同時の`await runner.many()`呼び出しを処理する
- ✅ 同時の`await runner.find()`呼び出しを処理する

### 8.2 Promise処理

- ✅ 非同期操作でPromiseチェーンを適切に処理する
- ⚠️ `QuerySpecification`コンポーネントからの`Promise.reject()`を処理する
- ✅ 全メソッドで一貫した非同期動作を維持する

---

## 9. 使用例

### 基本的な使用例

```typescript
// インスタンス作成
const runner: QueryRunnerInterface<TestData> = new QueryRunner(driver, spec, context)

// 単一レコード取得
const user = await runner.one({filter: {id: {eq: 1}}})
// user: TestData | null

// 複数レコード取得
const users = await runner.many({
  filter: {status: {eq: "active"}},
  orderBy: "name:asc",
  skip: 0,
  take: 10
})
// users: QueryResultList<TestData>

// 必須レコード取得
const requiredUser = await runner.find({filter: {email: {eq: "admin@example.com"}}})
// requiredUser: TestData (または例外)
```

### 高度な使用例

```typescript
// 複雑なフィルタリング
const results = await runner.many({
  filter: [
    {name: {contains: "admin"}, status: {eq: "active"}},
    {email: {ne: null}, "metadata.priority": {gte: 5}}
  ],
  orderBy: ["metadata.priority:desc", "name:asc"],
  skip: 20,
  take: 10
})

// エラーハンドリング
try {
  const user = await runner.find({filter: {id: {eq: 999}}})
} catch (error) {
  if (error instanceof QueryRunnerResourceNotFoundException) {
    console.log("ユーザーが見つかりませんでした")
  }
}
```

---

## 10. まとめ

`QueryRunner`は型安全で柔軟なデータクエリインターフェースを提供し、以下の特徴を持ちます：

- **型安全性**: TypeScriptの型システムを活用した安全なAPI
- **柔軟性**: 多様なフィルタリング、ソート、ページネーション機能
- **拡張性**: ミドルウェアとプロパティマッピングによる拡張
- **パフォーマンス**: 大規模データセットでも高速な応答
- **堅牢性**: 包括的なエラーハンドリングとエッジケース対応

この仕様書は`runner2.spec.ts`で定義された380+のテストケースに基づいており、完全な実装ガイドラインを提供します。