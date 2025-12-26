# @rym-lib/express-cli Proposal

## 概要

ExpressアプリケーションのルーティングをCLIインターフェースとして直接実行できるライブラリです。サーバーを起動せずに、既存のExpressミドルウェアやルートハンドラーをCLI環境でバッチ処理として実行できます。

## 主要な目玉機能

### ExpressインターフェースでのCLI実行
既存のExpressアプリケーションを**そのまま**CLIツールとして利用できます：

```bash
# 単一リクエスト実行
node cli.js /api/users --method=GET --headers='{"authorization":"Bearer token"}'

# POSTリクエストの実行
node cli.js /api/users --method=POST --body='{"name":"test","email":"test@example.com"}'

# バッチ処理（並列実行）
node cli.js batch --parallel \
  "/api/users --method=GET" \
  "/api/posts --method=GET" \
  "/api/comments --method=GET"

# バッチ処理（直列実行）
node cli.js batch --series \
  "/api/users --method=POST --body='{\"name\":\"user1\"}'" \
  "/api/users --method=POST --body='{\"name\":\"user2\"}'"
```

## 主要エンティティ

### 1. CliAdapter
- CLIコマンドをExpressのRequest/Responseオブジェクトに変換
- Express内部ルーティングとの橋渡し

### 2. RequestBuilder
- CLIパラメータ（--method, --body, --headers等）からExpressのリクエストオブジェクトを構築
- パラメータのバリデーション

### 3. ResponseHandler
- Express応答をCLI出力形式に変換
- ステータスコード、ヘッダー、ボディの整形

### 4. BatchProcessor
- 複数のコマンドを効率的に処理
- 並列・直列実行の選択
- エラーハンドリングと結果の集約

## ユースケース

### 1. 既存ExpressアプリのCLI化
```javascript
// app.js - 既存のExpressアプリ
const app = express();
app.get('/api/users', (req, res) => {
  res.json({ users: [...] });
});

// cli.js - CLIツール化
import app from './app.js';
import { expressCli } from '@rym-lib/express-cli';

expressCli(app).parse(process.argv);
```

### 2. データ移行・バッチ処理
```bash
# ユーザーデータの一括作成
node cli.js batch --series \
  "/api/users --method=POST --body=@users1.json" \
  "/api/users --method=POST --body=@users2.json" \
  "/api/users --method=POST --body=@users3.json"
```

### 3. API テスト・モニタリング
```bash
# ヘルスチェック
node cli.js /health --method=GET

# 認証テスト
node cli.js /api/login --method=POST --body='{"user":"test","pass":"secret"}'
```

### 4. 開発環境でのシード作成
```bash
# データベースシード
node cli.js batch --series \
  "/api/categories --method=POST --body=@seeds/categories.json" \
  "/api/products --method=POST --body=@seeds/products.json" \
  "/api/users --method=POST --body=@seeds/users.json"
```

## 技術的メリット

### 1. 既存リソースの再利用
- Expressミドルウェアがそのまま利用可能
- 認証、バリデーション、ビジネスロジックを再利用
- テストコードでの利用

### 2. サーバーレス実行
- HTTPサーバー起動不要
- CI/CD環境での実行に最適
- Docker環境での効率的な実行

### 3. 開発効率の向上
- API開発とCLIツール開発の二重管理不要
- 統一されたエラーハンドリング
- 既存のExpress生態系の活用

## API設計

### 基本的な使用方法
```javascript
import express from 'express';
import { expressCli } from '@rym-lib/express-cli';

const app = express();

// 通常のExpressルートそのまま
app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});

// CLIツール化
expressCli(app)
  .option('--config <path>', '設定ファイル')
  .option('--verbose', '詳細出力')
  .parse(process.argv);
```

### バッチ処理の設定
```javascript
expressCli(app)
  .batch({
    maxConcurrency: 10,    // 最大並列数
    continueOnError: true, // エラー時の継続
    timeout: 30000,        // タイムアウト（ms）
    retries: 3            // リトライ回数
  })
  .parse(process.argv);
```

## 実装優先度

### Phase 1 (MVP)
- [ ] 基本的なCLIAdapter実装
- [ ] 単一リクエストの実行機能
- [ ] 基本的なエラーハンドリング

### Phase 2
- [ ] バッチ処理機能（並列・直列）
- [ ] ファイルからのJSON読み込み（@file.json）
- [ ] 詳細出力・デバッグ機能

### Phase 3
- [ ] 設定ファイル対応
- [ ] プラグインシステム
- [ ] パフォーマンス最適化

## 想定される制約・課題

### 1. WebSocket・SSEの非対応
HTTP以外のプロトコルは対象外

### 2. セッション管理
CLIではセッションの永続化が困難

### 3. リアルタイム処理
非同期レスポンスの処理方法

## まとめ

`@rym-lib/express-cli`は、ExpressアプリケーションをそのままCLIツールとして活用できる革新的なライブラリです。既存のWebアプリケーション資産を活用し、開発効率を大幅に向上させることができます。