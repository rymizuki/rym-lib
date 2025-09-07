# @rym-lib/express-cli

ExpressアプリケーションをCLIインターフェースとして直接実行できるライブラリです。

## 特徴

- 🚀 **既存Expressアプリの再利用**: サーバー起動不要でExpressルートを実行
- 🔄 **バッチ処理対応**: 複数のリクエストを並列・直列で実行
- 🛠️ **ミドルウェア活用**: 既存のExpressミドルウェアをそのまま利用
- 📁 **ファイル読み込み**: JSONファイルから直接リクエストボディを読み込み

## インストール

```bash
npm install @rym-lib/express-cli
```

## 基本的な使用方法

```javascript
import express from 'express';
import { expressCli } from '@rym-lib/express-cli';

const app = express();

app.get('/api/users', (req, res) => {
  res.json({ users: ['user1', 'user2'] });
});

// CLIとして実行
expressCli(app).parse(process.argv);
```

## CLI使用例

### 単一リクエスト

```bash
# GET リクエスト
node cli.js /api/users

# POST リクエスト
node cli.js /api/users --method=POST --body='{"name":"test"}'

# ヘッダー付きリクエスト
node cli.js /api/users --headers='{"authorization":"Bearer token"}'

# ファイルからボディを読み込み
node cli.js /api/users --method=POST --body=@user.json
```

### バッチ処理

```bash
# 並列実行（デフォルト）
node cli.js batch \
  "/api/users --method=GET" \
  "/api/posts --method=GET"

# 直列実行
node cli.js batch --series \
  "/api/users --method=POST --body='{\"name\":\"user1\"}'" \
  "/api/users --method=POST --body='{\"name\":\"user2\"}'"

# エラー時も継続
node cli.js batch --continue-on-error \
  "/api/users --method=GET" \
  "/invalid/path --method=GET"
```

## API

### expressCli(app, options?)

Express アプリケーションをCLIに変換します。

#### Parameters

- `app`: Express アプリケーション
- `options`: 設定オプション（省略可能）
  - `verbose`: 詳細出力
  - `batchOptions`: バッチ処理設定

#### Returns

Commander.js の Command インスタンス

## 開発状況

現在開発中（v0.0.0）。基本機能の実装が完了しています。

## ライセンス

MIT