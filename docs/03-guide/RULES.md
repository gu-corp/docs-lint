# ルールリファレンス

**バージョン**: 2.0.0
**更新日**: 2026-02-18

---

## 概要

docs-lint に含まれるルール一覧です。各ルールは `"off"`、`"warn"`、`"error"` に設定できます。

## ルール一覧

| ルール | カテゴリ | デフォルト | 説明 |
|--------|----------|----------|------|
| brokenLinks | コンテンツ | error | リンク切れ検出 |
| legacyFileNames | コンテンツ | error | レガシーファイル名検出 |
| versionInfo | コンテンツ | warn | バージョン情報チェック |
| relatedDocuments | コンテンツ | warn | 関連ドキュメントセクション |
| headingHierarchy | コンテンツ | warn | 見出し階層チェック |
| todoComments | コンテンツ | warn | TODO/FIXME検出 |
| codeBlockLanguage | コンテンツ | warn | コードブロック言語指定 |
| orphanDocuments | コンテンツ | warn | 孤立ドキュメント検出 |
| terminology | コンテンツ | warn | 用語統一チェック |
| bidirectionalRefs | コンテンツ | off | 相互参照チェック |
| markdownLint | コンテンツ | warn | Markdownフォーマット |
| standardFolderStructure | 構造 | error | 標準フォルダ構成 |
| folderNumbering | 構造 | warn | フォルダ番号付け |
| fileNaming | 構造 | warn | ファイル命名規則 |
| standardFileNames | 構造 | warn | 標準ファイル名 |
| requirementTestMapping | 追跡 | warn | 要件-テスト対応 |
| requirementsCoverage | 追跡 | warn | 要件カバレッジ |
| standardsDrift | 追跡 | warn | 標準との差分 |

## コンテンツルール

### brokenLinks

存在しないファイルへの内部リンクを検出します。

**デフォルト**: `error`

**出力例**:

```text
README.md:15 Broken link: ./guide/SETUP.md (file not found)
```

**対応方法**:

- リンク先ファイルを作成する
- リンクを正しいパスに修正する
- リンクを削除する

### legacyFileNames

非推奨の命名パターン（例: `00-PROPOSAL.md`）を検出します。

**デフォルト**: `error`

**出力例**:

```text
01-plan/00-PROPOSAL.md Legacy file name pattern detected
  → Rename to PROPOSAL.md
```

**対応方法**:

```bash
git mv 01-plan/00-PROPOSAL.md 01-plan/PROPOSAL.md
```

### versionInfo

バージョン情報の有無をチェックします。

**デフォルト**: `warn`

**検出パターン**:

- `**Version**: X.X`
- `**バージョン**: X.X`

**出力例**:

```text
guide/SETUP.md Missing version information
  → Add **Version**: X.X at document start
```

**対応方法**:

ドキュメントの先頭に以下を追加：

```markdown
**バージョン**: 1.0
**更新日**: 2026-02-18
```

### relatedDocuments

「関連ドキュメント」セクションの有無をチェックします。

**デフォルト**: `warn`

**検出セクション名**:

- `## Related Documents`
- `## 関連ドキュメント`

**対応方法**:

ドキュメントの末尾に追加：

```markdown
---

## 関連ドキュメント

- [関連ファイル1](./CONFIGURATION.md)
- [関連ファイル2](./CLI.md)
```

### headingHierarchy

見出しの階層が正しいかチェックします（H1 → H2 → H3）。

**デフォルト**: `warn`

**出力例**:

```text
guide/API.md:45 Heading hierarchy violation: H1 → H4 (skipped H2, H3)
```

**対応方法**:

- 見出しレベルを連続させる
- H1 → H2 → H3 → H4 の順序を守る

### todoComments

未解決の `TODO`/`FIXME` コメントを検出します。

**デフォルト**: `warn`

**検出パターン**:

- `TODO:`
- `FIXME:`
- `XXX:`
- `HACK:`
- `BUG:`

**タグ別重要度**（v1.15.0+）:

| タグ | デフォルト | 説明 |
|-----|----------|------|
| `TODO` | info | 実装予定のタスク |
| `FIXME` | warn | 要修正の問題 |
| `XXX` | warn | 要注意箇所 |
| `HACK` | warn | 回避策・一時実装 |
| `BUG` | error | 既知のバグ |
| `NOTE` | off | 補足説明（デフォルト無視） |
| `REVIEW` | info | レビュー対象 |
| `OPTIMIZE` | info | 最適化候補 |

**設定例**:

```json
{
  "rules": {
    "todoComments": {
      "severity": "warn",
      "tags": {
        "TODO": { "severity": "info" },
        "FIXME": { "severity": "warn" },
        "BUG": { "severity": "error" },
        "NOTE": { "severity": "off" }
      },
      "ignoreInlineCode": true,
      "ignoreCodeBlocks": true
    }
  }
}
```

### codeBlockLanguage

コードブロックに言語指定があるかチェックします。

**デフォルト**: `warn`

**出力例**:

```text
guide/SETUP.md:67 Code block without language specifier
  → Add language (e.g., ```typescript, ```bash)
```

**対応方法**:

````text
```typescript
const x = 1;
```
````

### orphanDocuments

どこからもリンクされていないドキュメントを検出します。

**デフォルト**: `warn`

**出力例**:

```text
guide/OLD-SETUP.md Orphan document (not linked from anywhere)
```

**対応方法**:

- 他のドキュメントからリンクを追加する
- 不要であれば削除またはアーカイブする（`_archive/`へ移動）

### terminology

用語の不統一を検出します。

**デフォルト**: `warn`

**出力例**:

```text
guide/API.md:34 Inconsistent terminology: "api" → use "API"
```

**設定例**（v1.18.0+）:

```json
{
  "terminology": [
    {
      "preferred": "ドキュメント",
      "variants": ["文書"],
      "exceptions": ["ドキュメンテーション"],
      "wordBoundary": false
    },
    {
      "preferred": "API",
      "variants": ["api", "Api"],
      "wordBoundary": true
    }
  ]
}
```

### bidirectionalRefs

相互参照の欠落をチェックします。

**デフォルト**: `off`

**出力例**:

```text
guide/API.md links to guide/AUTH.md but AUTH.md doesn't link back
```

### markdownLint

markdownlintによるフォーマットチェックを実行します。

**デフォルト**: `warn`

**設定例**:

```json
{
  "rules": {
    "markdownLint": {
      "severity": "warn",
      "rules": {
        "MD013": false,
        "MD033": false
      }
    }
  }
}
```

**自動修正**:

```bash
npx docs-lint lint --fix
```

## 構造ルール

### standardFolderStructure

G.U.Corp標準フォルダ構成に従っているかチェックします。

**デフォルト**: `error`

**標準構成**:

```text
docs/
├── 01-plan/              # 企画・提案（必須）
├── 02-spec/              # 仕様（必須）
├── 03-guide/             # ガイド（必須）
├── 04-development/       # 開発者向け（必須）
├── 05-business/          # ビジネス（任意）
└── 06-reference/         # 参照（任意）
```

**出力例**:

```text
01-plan Required folder missing: 01-plan
  → mkdir -p 01-plan  # Planning & Proposals / 企画・提案
```

### folderNumbering

フォルダの番号付けが連番かチェックします。

**デフォルト**: `warn`

**設定例**:

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

- `strictPaths`: 厳密にチェックするパス
- `checkSequence`: 連番の欠番をチェック

### fileNaming

ファイル名がUPPER-CASE.md形式かチェックします。

**デフォルト**: `warn`

**許可されるパターン**:

- `README.md`
- `REQUIREMENTS.md`
- `API.md`
- `index.md`

### requirementTestMapping

要件ID（`FR-XXX`）とテストケースID（`TC-XXX`）の対応をチェックします。

**デフォルト**: `warn`

**出力例**:

```text
FR-001 has no corresponding test case
  → Add TC-U001 or TC-I001 for FR-001
```

**テストケースID体系**:

| 接頭辞 | カテゴリ | 説明 |
|--------|----------|------|
| TC-U | Unit | 単体テスト |
| TC-I | Integration | 統合テスト |
| TC-E | E2E | エンドツーエンドテスト |
| TC-P | Performance | 性能テスト |
| TC-S | Security | セキュリティテスト |
| TC-D | Deferred | 将来バージョンで対応 |
| TC-X | Excluded | スコープ外 |

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
