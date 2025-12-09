# 設定リファレンス

**バージョン**: 1.0
**更新日**: 2025-12-10

---

## 概要

docs-lint の設定ファイルオプションについて説明します。

## 設定ファイル

docs-lint は以下の順序で設定ファイルを検索します：

1. `docs-lint.config.json`
2. `docs-lint.config.js`
3. `.docs-lintrc.json`

## 基本設定

```json
{
  "docsDir": "./docs",
  "include": ["**/*.md"],
  "exclude": ["node_modules/**", "drafts/**"],
  "rules": {
    "brokenLinks": "error",
    "legacyFileNames": "error",
    "versionInfo": "warn",
    "relatedDocuments": "warn",
    "headingHierarchy": "warn",
    "todoComments": "warn",
    "codeBlockLanguage": "warn",
    "orphanDocuments": "warn",
    "terminology": "warn",
    "bidirectionalRefs": "off",
    "requirementsCoverage": "warn"
  }
}
```

## オプション詳細

### docsDir

型: `string`
デフォルト: `"./docs"`

ドキュメントのルートディレクトリ。

### include

型: `string[]`
デフォルト: `["**/*.md"]`

対象ファイルのglobパターン。

### exclude

型: `string[]`
デフォルト: `["node_modules/**"]`

除外ファイルのglobパターン。

### rules

型: `object`

各ルールの重要度設定。

| 値 | 説明 |
|-----|------|
| `"off"` | ルールを無効化 |
| `"warn"` | 警告として報告（CIは通過） |
| `"error"` | エラーとして報告（CIは失敗） |

### terminology

型: `array`

用語の統一ルールを定義：

```json
{
  "terminology": [
    {
      "preferred": "API",
      "variants": ["api", "Api"]
    },
    {
      "preferred": "ユーザー",
      "variants": ["user", "利用者"]
    }
  ]
}
```

### requiredFiles

型: `string[]`

必須ファイルのリスト：

```json
{
  "requiredFiles": ["README.md", "CHANGELOG.md"]
}
```

### requirementPatterns

型: `string[]`

要件IDの認識パターン：

```json
{
  "requirementPatterns": ["REQ-\\d+", "FR-\\d+"]
}
```

## 拡張ルール設定

一部のルールは詳細設定をサポートしています：

```json
{
  "rules": {
    "legacyFileNames": {
      "severity": "error",
      "pattern": "\\d{2}-[A-Z][A-Z0-9-]+\\.md",
      "exclude": ["archive/**"]
    },
    "versionInfo": {
      "severity": "warn",
      "patterns": ["**Version**:", "**バージョン**:"],
      "include": ["**/spec/**"]
    },
    "folderNumbering": {
      "severity": "warn",
      "strictPaths": ["", "02-spec"],
      "checkSequence": true
    }
  }
}
```

## 言語設定

多言語プロジェクト用に `docs/docs.config.json` を作成：

```json
{
  "commonLanguage": "en",
  "draftLanguages": ["ja", "vi", "en"],
  "teams": {
    "tokyo": "ja",
    "hanoi": "vi",
    "global": "en"
  }
}
```

## 設定例

### 厳格モード

```json
{
  "docsDir": "./docs",
  "rules": {
    "brokenLinks": "error",
    "legacyFileNames": "error",
    "versionInfo": "error",
    "relatedDocuments": "error",
    "headingHierarchy": "error",
    "todoComments": "error",
    "codeBlockLanguage": "error",
    "standardFolderStructure": "error",
    "requirementTestMapping": "error"
  }
}
```

### 最小モード

```json
{
  "docsDir": "./docs",
  "rules": {
    "brokenLinks": "error",
    "legacyFileNames": "warn",
    "versionInfo": "off",
    "todoComments": "off"
  }
}
```

---

## 関連ドキュメント

- [ルールリファレンス](./RULES.md)
- [はじめに](./GETTING-STARTED.md)
- [CLIリファレンス](./CLI.md)
