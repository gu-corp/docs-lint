# CI/CD 規約

**バージョン**: 2.0.0
**更新日**: 2026-02-18

---

## 概要

本文書は、G.U.Corp プロジェクトにおける CI/CD パイプラインの標準規約を定めます。

---

## 1. GitHub Actions 基本構成

### 1.1 必須ワークフロー

| ワークフロー | トリガー | 用途 |
|-------------|---------|------|
| `ci.yml` | push/PR to main | ビルド・テスト |
| `release.yml` | tag v* | リリース作成 |

### 1.2 CI ワークフロー例

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - run: npm test
```

### 1.3 Release ワークフロー例

```yaml
name: Release

on:
  push:
    tags: ['v*']

permissions:
  contents: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - run: npm test
      - uses: softprops/action-gh-release@v1
        with:
          generate_release_notes: true
```

---

## 2. ブランチ保護ルール

### 2.1 main ブランチ

| 設定 | 値 |
|------|-----|
| Require pull request reviews | 有効 |
| Required approving reviews | 1以上 |
| Require status checks to pass | 有効 |
| Required status checks | CI |
| Require branches to be up to date | 有効 |

### 2.2 設定方法

```text
Settings > Branches > Add rule
- Branch name pattern: main
- 上記設定を適用
```

---

## 3. タグ保護ルール

### 3.1 リリースタグ

| 設定 | 値 |
|------|-----|
| Tag name pattern | `v*` |
| Restrict who can create matching tags | 有効 |
| Allowed actors | Maintainers以上 |

### 3.2 タグ命名規則

```text
v{MAJOR}.{MINOR}.{PATCH}[-{prerelease}]
```

| 例 | 説明 |
|-----|------|
| `v1.0.0` | 正式リリース |
| `v1.0.0-beta.1` | ベータリリース |
| `v1.0.0-rc.1` | リリース候補 |

---

## 4. Secrets 管理

### 4.1 標準 Secrets

| Secret名 | 用途 |
|----------|------|
| `NPM_TOKEN` | npm publish（公開パッケージ） |
| `DEPLOY_KEY` | デプロイ用SSH鍵 |

### 4.2 禁止事項

- Secretsをログに出力しない
- Secretsをコードにハードコードしない
- 不要になったSecretsは削除する

---

## 5. 環境変数

### 5.1 命名規則

```text
{SERVICE}_{PURPOSE}_{TYPE}
```

| 例 | 説明 |
|-----|------|
| `AWS_ACCESS_KEY_ID` | AWSアクセスキーID |
| `DATABASE_URL` | データベース接続URL |
| `NEXT_PUBLIC_API_URL` | 公開API URL |

### 5.2 環境別ファイル

| ファイル | 環境 | コミット |
|---------|------|---------|
| `.env.example` | テンプレート | 可 |
| `.env.local` | ローカル開発 | 不可 |
| `.env.production` | 本番 | 不可 |

---

## 6. デプロイ戦略

### 6.1 環境構成

| 環境 | ブランチ | デプロイ |
|------|---------|---------|
| Development | feature/* | 自動（任意） |
| Staging | main | 自動 |
| Production | tag v* | 手動承認 |

### 6.2 ロールバック

- 問題発生時は前のタグを再デプロイ
- ホットフィックスが必要な場合は`hotfix/*`ブランチを使用

---

## 関連ドキュメント

- [Git ワークフロー](GIT-WORKFLOW.md)
- [コーディング規約](CODING-STANDARDS.md)
- [テスト規約](TESTING.md)
