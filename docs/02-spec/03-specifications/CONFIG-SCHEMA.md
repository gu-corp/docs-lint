# 設定スキーマ仕様

**バージョン**: 2.0.0
**更新日**: 2026-02-18

---

## 概要

`docs-lint.config.json` の完全な設定スキーマを定義します。

## 設定ファイル

プロジェクトルートに `docs-lint.config.json` を配置します。

```json
{
  "docsDir": "./docs",
  "include": ["**/*.md"],
  "exclude": ["**/_*/**"],
  "rules": { ... },
  "terminology": [ ... ],
  "requiredFiles": [ ... ],
  "testing": { ... }
}
```

## トップレベルプロパティ

| プロパティ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| `docsDir` | `string` | `"./docs"` | ドキュメントルートディレクトリ |
| `include` | `string[]` | `["**/*.md"]` | 対象ファイルのglobパターン |
| `exclude` | `string[]` | `["**/_*/**", "**/_*.md"]` | 除外ファイルのglobパターン |
| `rules` | `RulesConfig` | 下記参照 | ルール設定 |
| `terminology` | `TerminologyMapping[]` | `[]` | 用語統一設定 |
| `requiredFiles` | `string[]` | `[]` | 必須ファイル一覧 |
| `requirementPatterns` | `RequirementPattern[]` | `[]` | 要件IDパターン |
| `i18n` | `I18nConfig` | - | 多言語設定（オプション） |
| `testing` | `TestingConfig` | 下記参照 | テスト評価設定 |

---

## ルール設定（rules）

各ルールは以下の形式で設定できます：

```typescript
// シンプル形式
"ruleName": "off" | "warn" | "error"

// 詳細設定形式
"ruleName": {
  "severity": "off" | "warn" | "error",
  // ルール固有のオプション
}
```

### コンテンツルール

#### brokenLinks

内部リンク切れを検出します。

| 設定値 | 説明 |
|--------|------|
| `"error"` | リンク切れをエラーとして報告（デフォルト） |
| `"warn"` | 警告として報告 |
| `"off"` | チェック無効 |

#### legacyFileNames

レガシーファイル名パターン（`00-XXXX.md` 形式）を検出します。

```json
{
  "legacyFileNames": {
    "severity": "error",
    "pattern": "\\d{2}-[A-Z][A-Z0-9-]+\\.md",
    "exclude": ["archive/**"]
  }
}
```

| オプション | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| `severity` | `RuleSeverity` | `"error"` | 重要度 |
| `pattern` | `string` | `"\\d{2}-..."` | 検出パターン（正規表現） |
| `exclude` | `string[]` | `[]` | 除外パターン |

#### versionInfo

ドキュメントにバージョン情報があるか確認します。

```json
{
  "versionInfo": {
    "severity": "warn",
    "patterns": ["**バージョン**:", "**Version**:"],
    "include": ["**/spec/**"]
  }
}
```

| オプション | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| `severity` | `RuleSeverity` | `"warn"` | 重要度 |
| `patterns` | `string[]` | `["**バージョン**:"]` | バージョン情報を示すパターン |
| `include` | `string[]` | `["**/*.md"]` | チェック対象ファイル |

#### relatedDocuments

関連ドキュメントセクションの有無を確認します。

```json
{
  "relatedDocuments": {
    "severity": "warn",
    "patterns": ["## 関連ドキュメント", "## Related"],
    "include": ["**/spec/**"]
  }
}
```

#### headingHierarchy

見出しの階層が正しいか確認します（H1→H2→H3の順）。

| 設定値 | 説明 |
|--------|------|
| `"warn"` | 階層スキップを警告（デフォルト） |
| `"error"` | エラーとして報告 |
| `"off"` | チェック無効 |

#### todoComments

TODO/FIXME等のコメントを検出します。

```json
{
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
    "customTags": ["REVIEW", "OPTIMIZE"],
    "excludePatterns": ["NOTE:.*設計意図"]
  }
}
```

| オプション | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| `severity` | `RuleSeverity` | `"warn"` | 基本重要度 |
| `tags` | `Record<string, TodoTagConfig>` | 下記参照 | タグ別設定 |
| `ignoreInlineCode` | `boolean` | `true` | インラインコード内を無視 |
| `ignoreCodeBlocks` | `boolean` | `true` | コードブロック内を無視 |
| `ignoreInTables` | `boolean` | `false` | テーブル内を無視 |
| `customTags` | `string[]` | `[]` | カスタムタグ追加 |
| `excludePatterns` | `string[]` | `[]` | 除外パターン（正規表現） |

**デフォルトタグ設定**:

| タグ | severity | 説明 |
|------|----------|------|
| `TODO` | `info` | 実装予定 |
| `FIXME` | `warn` | 要修正 |
| `XXX` | `warn` | 要注意 |
| `HACK` | `warn` | 回避策 |
| `BUG` | `error` | バグ |
| `NOTE` | `off` | 補足（無視） |
| `REVIEW` | `info` | レビュー対象 |
| `OPTIMIZE` | `info` | 最適化候補 |
| `WARNING` | `warn` | 警告 |
| `QUESTION` | `info` | 要確認 |

#### codeBlockLanguage

コードブロックに言語指定があるか確認します。

| 設定値 | 説明 |
|--------|------|
| `"warn"` | 言語未指定を警告（デフォルト） |

#### orphanDocuments

どこからもリンクされていない孤立ドキュメントを検出します。

| 設定値 | 説明 |
|--------|------|
| `"warn"` | 孤立ドキュメントを警告（デフォルト） |

#### terminology

用語の不統一を検出します（`terminology` 配列と連携）。

| 設定値 | 説明 |
|--------|------|
| `"warn"` | 用語不統一を警告（デフォルト） |

### 構造ルール

#### standardFolderStructure

G.U.Corp 標準フォルダ構成をチェックします。

| 設定値 | 説明 |
|--------|------|
| `"error"` | 構成違反をエラー（デフォルト） |

**標準構成**:

```text
docs/
├── 01-plan/           # 必須
├── 02-spec/           # 必須
│   ├── 01-requirements/
│   ├── 02-architecture/
│   ├── 03-specifications/
│   ├── 04-testing/
│   └── 05-reference/
├── 03-guide/          # 必須
├── 04-development/    # 必須
├── 05-business/       # オプション
└── 06-reference/      # オプション
```

#### folderNumbering

フォルダ番号付けの一貫性をチェックします。

```json
{
  "folderNumbering": {
    "severity": "warn",
    "strictPaths": ["", "02-spec"],
    "checkSequence": true
  }
}
```

| オプション | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| `severity` | `RuleSeverity` | `"warn"` | 重要度 |
| `strictPaths` | `string[]` | `["", "02-spec"]` | 番号必須のパス |
| `checkSequence` | `boolean` | `true` | 連番チェック |

#### fileNaming

ファイル命名規則（UPPER-CASE.md）をチェックします。

| 設定値 | 説明 |
|--------|------|
| `"warn"` | 命名違反を警告（デフォルト） |

#### standardsDrift

開発標準ファイルがテンプレートと異なるか検出します。

```json
{
  "standardsDrift": {
    "severity": "warn",
    "categories": ["04-development"],
    "reportMissing": true,
    "reportDifferent": true
  }
}
```

| オプション | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| `categories` | `string[]` | `["04-development"]` | チェック対象カテゴリ |
| `reportMissing` | `boolean` | `true` | 欠落ファイルを報告 |
| `reportDifferent` | `boolean` | `true` | 差分を報告 |

### 要件追跡ルール

#### requirementTestMapping

要件IDとテストケースIDの対応をチェックします。

```json
{
  "requirementTestMapping": {
    "severity": "error",
    "requirementPattern": "FR-([A-Z]+-)*\\d{3}",
    "testCasePattern": "TC-[UIEPSDX]\\d{3}",
    "requirementFiles": ["**/REQUIREMENTS.md"],
    "testCaseFiles": ["**/TEST-CASES.md"],
    "requiredCoverage": 100
  }
}
```

| オプション | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| `requirementPattern` | `string` | `"FR-..."` | 要件IDパターン |
| `testCasePattern` | `string` | `"TC-..."` | テストケースIDパターン |
| `requirementFiles` | `string[]` | `["**/REQUIREMENTS.md"]` | 要件ファイル |
| `testCaseFiles` | `string[]` | `["**/TEST-CASES.md"]` | テストファイル |
| `requiredCoverage` | `number` | `100` | 必要カバレッジ率 |

### Markdownルール

#### markdownLint

markdownlint によるフォーマットチェックを実行します。

```json
{
  "markdownLint": {
    "severity": "warn",
    "rules": {
      "MD013": false,
      "MD033": false,
      "MD041": true
    },
    "exclude": ["**/generated/**"]
  }
}
```

| オプション | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| `rules` | `Record<string, boolean>` | `{}` | markdownlintルール設定 |
| `exclude` | `string[]` | `[]` | 除外パターン |

---

## 用語設定（terminology）

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

| プロパティ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `preferred` | `string` | ○ | 推奨する用語 |
| `variants` | `string[]` | ○ | 置換対象の用語 |
| `exceptions` | `string[]` | - | 例外パターン |
| `wordBoundary` | `boolean` | - | 単語境界でマッチ（デフォルト: false） |

---

## テスト設定（testing）

`review code` コマンドでのコード品質評価基準を設定します。

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

### プロジェクトタイプ

| タイプ | Unit | Min Coverage | Integration | E2E |
|--------|------|--------------|-------------|-----|
| `library` | 必須 | 80% | - | - |
| `api` | 必須 | 70% | 必須 | - |
| `web-app` | 必須 | 60% | 必須 | 必須 |
| `cli` | 必須 | 60% | - | - |
| `critical` | 必須 | 90% | 必須 | 必須 |

### カバレッジ閾値

| カテゴリ | デフォルト | 説明 |
|----------|-----------|------|
| `coreLogic` | 100% | ビジネスロジック |
| `utilities` | 90% | ユーティリティ |
| `api` | 80% | APIコントローラ |
| `ui` | 60% | UIコンポーネント |
| `overall` | 70% | 全体最小値 |

### パターン設定

| プロパティ | デフォルトパターン |
|-----------|-------------------|
| `coreLogicPatterns` | `src/domain/**`, `src/lib/**`, `src/rules/**`, `src/services/**` |
| `utilityPatterns` | `src/utils/**`, `src/helpers/**`, `src/shared/**` |
| `apiPatterns` | `src/api/**`, `src/controllers/**`, `src/routes/**` |
| `uiPatterns` | `src/components/**`, `src/pages/**`, `src/views/**` |
| `excludePatterns` | `**/*.test.ts`, `**/index.ts`, `**/*.d.ts` |

---

## i18n設定（i18n）

多言語ドキュメントの設定です。

```json
{
  "i18n": {
    "sourceLanguage": "ja",
    "targetLanguages": ["en"],
    "translationsFolder": "translations",
    "checkSync": true
  }
}
```

| プロパティ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| `sourceLanguage` | `string` | - | ソース言語コード |
| `targetLanguages` | `string[]` | `[]` | ターゲット言語 |
| `translationsFolder` | `string` | `"translations"` | 翻訳フォルダ名 |
| `checkSync` | `boolean` | `false` | 翻訳同期チェック |

---

## 設定例

### 最小設定

```json
{
  "docsDir": "./docs"
}
```

### 標準設定

```json
{
  "docsDir": "./docs",
  "rules": {
    "brokenLinks": "error",
    "todoComments": "warn",
    "standardFolderStructure": "error"
  }
}
```

### 厳格設定

```json
{
  "docsDir": "./docs",
  "rules": {
    "brokenLinks": "error",
    "legacyFileNames": "error",
    "versionInfo": "error",
    "headingHierarchy": "error",
    "todoComments": {
      "severity": "error",
      "tags": {
        "TODO": { "severity": "warn" },
        "FIXME": { "severity": "error" },
        "BUG": { "severity": "error" }
      }
    },
    "standardFolderStructure": "error",
    "requirementTestMapping": "error"
  },
  "testing": {
    "projectType": "critical",
    "coverageThresholds": {
      "coreLogic": 100,
      "overall": 90
    }
  }
}
```

---

## 関連ドキュメント

- [CLIリファレンス](../../03-guide/CLI.md)
- [設定ガイド](../../03-guide/CONFIGURATION.md)
- [ルールリファレンス](../../03-guide/RULES.md)
- [クラス設計](../02-architecture/CLASS.md)
