# はじめに

**バージョン**: 1.18.0
**更新日**: 2026-02-18

---

## 概要

このガイドでは、docs-lint のインストールと初回実行について説明します。

## 前提条件

- Node.js 18以上
- npm または yarn

```bash
# バージョン確認
node --version  # v18.0.0以上
npm --version
```

## インストール

### GitHub からインストール

```bash
npm install github:gu-corp/docs-lint --save-dev
```

または `package.json` に追加：

```json
{
  "devDependencies": {
    "@gu-corp/docs-lint": "github:gu-corp/docs-lint"
  }
}
```

### 特定バージョンをインストール

```bash
npm install github:gu-corp/docs-lint#v1.18.0 --save-dev
```

## クイックスタート

### 1. 設定ファイルの初期化

対話形式のウィザードを実行：

```bash
npx docs-lint init
```

これにより以下が作成されます：

- `docs-lint.config.json` - リントルール設定
- `docs/docs.config.json` - 言語設定

**デフォルト値で即座に作成**:

```bash
npx docs-lint init -y
```

### 2. 標準フォルダ構成の生成（推奨）

G.U.Corp標準のフォルダ構成を自動生成：

```bash
npx docs-lint scaffold -d ./docs
```

生成される構成：

```text
docs/
├── 01-plan/              # 企画・提案
├── 02-spec/              # 仕様
│   ├── 01-requirements/
│   ├── 02-architecture/
│   ├── 03-specifications/
│   ├── 04-testing/
│   └── 05-reference/
├── 03-guide/             # ガイド
└── 04-development/       # 開発者向け
```

### 3. ドキュメント標準の生成（オプション）

プロジェクト固有の標準テンプレートを生成：

```bash
npx docs-lint init-standards
```

これにより `docs/DOCUMENT_STANDARDS.md` が作成されます。

### 4. リントの実行

```bash
npx docs-lint lint
```

詳細出力：

```bash
npx docs-lint lint -v
```

## 出力例

### 成功時

```text
📄 Documentation Lint Results

Files checked: 15
Status: PASSED

Summary:
  Errors: 0
  Warnings: 3
  Passed: 8

✓ brokenLinks
✓ legacyFileNames
✓ versionInfo
⚠ todoComments (2 issues)
    README.md:45 Unresolved TODO: サンプルを追加
    guide/SETUP.md:12 Unresolved FIXME: v2対応
✓ codeBlockLanguage
```

### 失敗時

```text
📄 Documentation Lint Results

Files checked: 15
Status: FAILED

Summary:
  Errors: 2
  Warnings: 3
  Passed: 6

✗ brokenLinks (2 errors)
    README.md:15 Broken link: ./guide/SETUP.md (file not found)
    API.md:23 Broken link: ./auth/LOGIN.md (file not found)
⚠ todoComments (3 issues)
    ...
```

## よくあるユースケース

### PRレビュー前のチェック

```bash
# クイックチェック
npx docs-lint lint

# 問題があれば自動修正
npx docs-lint lint --fix

# 詳細確認
npx docs-lint lint -v
```

### CI/CDパイプラインでの使用

```bash
# JSON出力でログ保存
npx docs-lint lint --json > docs-lint-report.json

# 終了コードで判定
# 0: 成功, 1: エラーあり
```

### AIレビューの準備

```bash
# AIプロンプト生成
npx docs-lint lint --ai-prompt > quality-report.md

# 生成されたレポートをClaudeなどに渡す
```

### 特定ルールのみ実行

```bash
# リンク切れのみチェック
npx docs-lint lint --only brokenLinks

# 複数ルール
npx docs-lint lint --only brokenLinks,todoComments

# 特定ルールをスキップ
npx docs-lint lint --skip terminology,orphanDocuments
```

## npm scriptsへの追加

`package.json` に追加：

```json
{
  "scripts": {
    "lint:docs": "docs-lint lint",
    "lint:docs:fix": "docs-lint lint --fix",
    "lint:docs:ci": "docs-lint lint --json > docs-lint-report.json"
  }
}
```

使用：

```bash
npm run lint:docs
npm run lint:docs:fix
```

## トラブルシューティング

### "Command not found" エラー

```bash
# npxを使用
npx docs-lint lint

# またはパスを確認
./node_modules/.bin/docs-lint lint
```

### ESMエラー

```bash
# Node.jsバージョン確認
node --version  # 18以上が必要

# package.jsonに"type": "module"があるか確認
```

### 設定が読み込まれない

```bash
# 設定ファイルの存在確認
ls -la docs-lint.config.json

# 明示的に指定
npx docs-lint lint -c ./docs-lint.config.json
```

## 次のステップ

- [設定リファレンス](./CONFIGURATION.md) - 設定オプションの詳細
- [ルールリファレンス](./RULES.md) - 利用可能なルール一覧
- [CLIリファレンス](./CLI.md) - 全コマンドの詳細
- [CI/CD設定](../04-development/CI-CD.md) - GitHub Actions統合

---

## 関連ドキュメント

- [設定リファレンス](./CONFIGURATION.md)
- [ルールリファレンス](./RULES.md)
- [CLIリファレンス](./CLI.md)
