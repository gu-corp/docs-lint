# 設定リファレンス

**バージョン**: 1.18.0
**更新日**: 2026-02-18

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

| 項目 | 値 |
|------|-----|
| 型 | `string` |
| デフォルト | `"./docs"` |

ドキュメントのルートディレクトリ。

### include

| 項目 | 値 |
|------|-----|
| 型 | `string[]` |
| デフォルト | `["**/*.md"]` |

対象ファイルのglobパターン。

### exclude

| 項目 | 値 |
|------|-----|
| 型 | `string[]` |
| デフォルト | `["node_modules/**", "**/_*/**", "**/_*.md"]` |

除外ファイルのglobパターン。

**デフォルトで除外されるパターン**:

- `node_modules/**` - 依存パッケージ
- `**/_*/**` - アンダースコアで始まるフォルダ（アーカイブ）
- `**/_*.md` - アンダースコアで始まるファイル

### rules

| 項目 | 値 |
|------|-----|
| 型 | `object` |

各ルールの重要度設定。

| 値 | 説明 |
|-----|------|
| `"off"` | ルールを無効化 |
| `"warn"` | 警告として報告（CIは通過） |
| `"error"` | エラーとして報告（CIは失敗） |

### terminology

| 項目 | 値 |
|------|-----|
| 型 | `array` |

用語の統一ルールを定義：

```json
{
  "terminology": [
    {
      "preferred": "API",
      "variants": ["api", "Api"],
      "wordBoundary": true
    },
    {
      "preferred": "ドキュメント",
      "variants": ["文書"],
      "exceptions": ["ドキュメンテーション"],
      "wordBoundary": false
    }
  ]
}
```

| プロパティ | 説明 |
|-----------|------|
| `preferred` | 推奨する用語 |
| `variants` | 置換対象の用語 |
| `exceptions` | 例外パターン（v1.18.0+） |
| `wordBoundary` | 単語境界でマッチ（v1.18.0+） |

### requiredFiles

| 項目 | 値 |
|------|-----|
| 型 | `string[]` |

必須ファイルのリスト：

```json
{
  "requiredFiles": ["README.md", "CHANGELOG.md"]
}
```

### requirementPatterns

| 項目 | 値 |
|------|-----|
| 型 | `string[]` |

要件IDの認識パターン：

```json
{
  "requirementPatterns": ["REQ-\\d+", "FR-\\d+"]
}
```

## 拡張ルール設定

一部のルールは詳細設定をサポートしています：

### legacyFileNames

```json
{
  "rules": {
    "legacyFileNames": {
      "severity": "error",
      "pattern": "\\d{2}-[A-Z][A-Z0-9-]+\\.md",
      "exclude": ["archive/**"]
    }
  }
}
```

### versionInfo

```json
{
  "rules": {
    "versionInfo": {
      "severity": "warn",
      "patterns": ["**Version**:", "**バージョン**:"],
      "include": ["**/spec/**"]
    }
  }
}
```

### folderNumbering

```json
{
  "rules": {
    "folderNumbering": {
      "severity": "warn",
      "strictPaths": ["", "02-spec"],
      "checkSequence": true
    }
  }
}
```

### todoComments

```json
{
  "rules": {
    "todoComments": {
      "severity": "warn",
      "tags": {
        "TODO": { "severity": "info", "message": "実装予定" },
        "FIXME": { "severity": "warn", "message": "要修正" },
        "BUG": { "severity": "error", "message": "バグ" },
        "NOTE": { "severity": "off" }
      },
      "ignoreInlineCode": true,
      "ignoreCodeBlocks": true,
      "ignoreInTables": false,
      "customTags": ["LATER"],
      "excludePatterns": ["TODO\\(scheduled\\)"]
    }
  }
}
```

### markdownLint

```json
{
  "rules": {
    "markdownLint": {
      "severity": "warn",
      "rules": {
        "MD013": false,
        "MD033": false,
        "MD041": false
      }
    }
  }
}
```

## テスト設定（v1.16.0+）

`check:code` および `review:code` で使用するテスト評価基準を設定します。

```json
{
  "testing": {
    "projectType": "api",
    "coreLogicPatterns": [
      "src/domain/**/*.ts",
      "src/rules/**/*.ts"
    ],
    "coverageThresholds": {
      "coreLogic": 100,
      "utilities": 90,
      "api": 80,
      "ui": 60,
      "overall": 70
    },
    "requireIntegrationTests": ["src/api/**/*.ts"],
    "requireE2ETests": false,
    "requireCITests": true
  }
}
```

### projectType

| タイプ | 単体テスト | 最小カバレッジ | 統合テスト | E2E |
|--------|----------|--------------|-----------|-----|
| `library` | 必須 | 80% | - | - |
| `api` | 必須 | 70% | 必須 | - |
| `web-app` | 必須 | 60% | 必須 | 必須 |
| `cli` | 必須 | 60% | - | - |
| `critical` | 必須 | 90% | 必須 | 必須 |

### coverageThresholds

| カテゴリ | デフォルト | 説明 |
|----------|---------|------|
| `coreLogic` | 100% | ビジネスロジック |
| `utilities` | 90% | ユーティリティ |
| `api` | 80% | APIコントローラ |
| `ui` | 60% | UIコンポーネント |
| `overall` | 70% | 全体最低ライン |

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

### CI用モード

```json
{
  "docsDir": "./docs",
  "exclude": ["**/drafts/**", "**/wip/**"],
  "rules": {
    "brokenLinks": "error",
    "legacyFileNames": "error",
    "versionInfo": "warn",
    "todoComments": {
      "severity": "warn",
      "tags": {
        "BUG": { "severity": "error" },
        "TODO": { "severity": "off" }
      }
    }
  }
}
```

---

## 関連ドキュメント

- [ルールリファレンス](./RULES.md)
- [はじめに](./GETTING-STARTED.md)
- [CLIリファレンス](./CLI.md)
