# ルールリファレンス

**バージョン**: 1.0
**更新日**: 2025-12-10

---

## 概要

docs-lint に含まれるルール一覧です。各ルールは `"off"`、`"warn"`、`"error"` に設定できます。

## コンテンツルール

### brokenLinks

存在しないファイルへの内部リンクを検出します。

**デフォルト**: `error`

```text
README.md:15 Broken link: ./guide/SETUP.md (file not found)
```

### legacyFileNames

非推奨の命名パターン（例: `00-PROPOSAL.md`）を検出します。

**デフォルト**: `error`

```text
01-plan/00-PROPOSAL.md Legacy file name pattern detected
  → Rename to PROPOSAL.md
```

### versionInfo

バージョン情報の有無をチェックします。

**デフォルト**: `warn`

**検出パターン**:

- `**Version**: X.X`
- `**バージョン**: X.X`

```text
guide/SETUP.md Missing version information
  → Add **Version**: X.X at document start
```

### relatedDocuments

「関連ドキュメント」セクションの有無をチェックします。

**デフォルト**: `warn`

**検出セクション名**:

- `## Related Documents`
- `## 関連ドキュメント`

### headingHierarchy

見出しの階層が正しいかチェックします（H1 → H2 → H3）。

**デフォルト**: `warn`

```text
guide/API.md:45 Heading hierarchy violation: H1 → H4 (skipped H2, H3)
```

### `todoComments`

未解決の `TODO`/`FIXME` コメントを検出します。

**デフォルト**: `warn`

**検出パターン**:

- `TODO:`
- `FIXME:`
- `XXX:`

```text
README.md:23 Unresolved TODO: 認証ドキュメントを追加
```

### codeBlockLanguage

コードブロックに言語指定があるかチェックします。

**デフォルト**: `warn`

```text
guide/SETUP.md:67 Code block without language specifier
  → Add language (e.g., ```typescript, ```bash)
```

### orphanDocuments

どこからもリンクされていないドキュメントを検出します。

**デフォルト**: `warn`

```text
guide/OLD-SETUP.md Orphan document (not linked from anywhere)
```

### terminology

用語の不統一を検出します。

**デフォルト**: `warn`

```text
guide/API.md:34 Inconsistent terminology: "api" → use "API"
```

### bidirectionalRefs

相互参照の欠落をチェックします。

**デフォルト**: `off`

```text
guide/API.md links to guide/AUTH.md but AUTH.md doesn't link back
```

### requirementsCoverage

要件IDが仕様書でカバーされているかチェックします。

**デフォルト**: `warn`

`requirementPatterns` 設定が必要です。

## 構造ルール

### standardFolderStructure

G.U.Corp標準フォルダ構成に従っているかチェックします。

**デフォルト**: `error`

```text
01-plan Required folder missing: 01-plan
  → mkdir -p 01-plan  # Planning & Proposals / 企画・提案
```

### folderNumbering

フォルダの番号付けが連番かチェックします。

**デフォルト**: `warn`

```json
{
  "folderNumbering": {
    "severity": "warn",
    "strictPaths": ["", "02-spec"],
    "checkSequence": true
  }
}
```

### fileNaming

ファイル名がUPPER-CASE.md形式かチェックします。

**デフォルト**: `warn`

### standardFileNames

標準ファイル名（README.md, REQUIREMENTS.md等）の存在をチェックします。

**デフォルト**: `warn`

### requirementTestMapping

要件ID（`FR-XXX`）とテストケースID（`TC-XXX`）の対応をチェックします。

**デフォルト**: `warn`

```text
FR-001 has no corresponding test case
  → Add TC-U001 or TC-I001 for FR-001
```

### standardsDrift

プロジェクトの標準ファイルがテンプレートと異なるかチェックします。

**デフォルト**: `warn`

## ルール設定例

### ルールを無効化

```json
{
  "rules": {
    "todoComments": "off"
  }
}
```

### 警告をエラーに

```json
{
  "rules": {
    "versionInfo": "error"
  }
}
```

### 詳細設定

```json
{
  "rules": {
    "legacyFileNames": {
      "severity": "error",
      "exclude": ["archive/**", "legacy/**"]
    }
  }
}
```

---

## 関連ドキュメント

- [設定リファレンス](./CONFIGURATION.md)
- [CLIリファレンス](./CLI.md)
- [はじめに](./GETTING-STARTED.md)
