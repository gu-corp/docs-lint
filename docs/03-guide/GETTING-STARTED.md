# はじめに

**バージョン**: 1.0
**更新日**: 2025-12-10

---

## 概要

このガイドでは、docs-lint のインストールと初回実行について説明します。

## 前提条件

- Node.js 18以上
- npm または yarn

## インストール

### GitHub からインストール

```bash
npm install github:gu-corp/docs-lint
```

または `package.json` に追加：

```json
{
  "devDependencies": {
    "@gu-corp/docs-lint": "github:gu-corp/docs-lint"
  }
}
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

### 2. ドキュメント標準の生成（オプション）

標準テンプレートを生成：

```bash
npx docs-lint init-standards
```

これにより `docs/DOCUMENT_STANDARDS.md` が作成されます。

### 3. リントの実行

```bash
npx docs-lint lint
```

詳細出力：

```bash
npx docs-lint lint -v
```

## 出力例

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

## 次のステップ

- [設定リファレンス](./CONFIGURATION.md) - 設定オプションの詳細
- [ルールリファレンス](./RULES.md) - 利用可能なルール一覧
- [CI/CD設定](../04-development/CI-CD.md) - GitHub Actions統合

---

## 関連ドキュメント

- [設定リファレンス](./CONFIGURATION.md)
- [ルールリファレンス](./RULES.md)
- [CLIリファレンス](./CLI.md)
