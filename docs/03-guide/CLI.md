# CLIリファレンス

**バージョン**: 2.0.0
**更新日**: 2026-02-18

---

## 概要

docs-lint v2.0 のコマンドラインインターフェースについて説明します。

## コマンド構造

```text
docs-lint
├── lint [options]           # リント実行
├── init [options]           # 初期化（統合）
├── check <target>           # 静的チェック
│   ├── code                 # コードチェック
│   └── spec                 # 仕様チェック
├── review <target>          # AIレビュー
│   ├── code                 # コードレビュー
│   └── spec                 # 仕様レビュー（MECE含む）
└── show <what>              # 情報表示
    ├── standards            # 標準表示
    ├── config               # 設定表示
    └── rules                # ルール一覧
```

## コマンド詳細

### lint

ドキュメントのリントを実行します。

```bash
docs-lint lint [オプション]
```

**オプション**:

| オプション | 説明 |
|-----------|------|
| `-d, --docs-dir <path>` | ドキュメントディレクトリ（デフォルト: `./docs`） |
| `-c, --config <path>` | 設定ファイルパス |
| `--only <rules>` | 指定ルールのみ実行（カンマ区切り） |
| `--skip <rules>` | 指定ルールをスキップ（カンマ区切り） |
| `-v, --verbose` | 詳細出力 |
| `--json` | JSON形式で出力 |
| `--ai-prompt` | AI向け評価プロンプトを生成 |
| `--fix` | マークダウンフォーマットを自動修正 |

**使用例**:

```bash
# 基本的なリント
docs-lint lint

# ディレクトリ指定
docs-lint lint -d ./documentation

# 詳細出力
docs-lint lint -v

# 特定ルールのみ実行
docs-lint lint --only brokenLinks,todoComments

# 特定ルールをスキップ
docs-lint lint --skip terminology,orphanDocuments

# JSON出力
docs-lint lint --json

# AIプロンプト生成
docs-lint lint --ai-prompt > report.md

# 自動修正
docs-lint lint --fix
```

### init

設定ファイルと関連リソースを初期化します。

```bash
docs-lint init [オプション]
```

**オプション**:

| オプション | 説明 |
|-----------|------|
| `-d, --docs-dir <path>` | ドキュメントディレクトリ（デフォルト: `./docs`） |
| `-y, --yes` | ウィザードをスキップ、デフォルト値を使用 |
| `--standards` | DOCUMENT_STANDARDS.mdも生成 |
| `--scaffold` | 標準フォルダ構成も生成 |

**使用例**:

```bash
# 対話形式セットアップ
docs-lint init

# デフォルト値で作成
docs-lint init -y

# 標準ファイルも生成
docs-lint init --standards

# フォルダ構成も生成
docs-lint init --scaffold

# すべて生成
docs-lint init -y --standards --scaffold
```

**生成されるもの**:

- `docs-lint.config.json` - リントルール設定
- `docs/docs.config.json` - 言語設定
- `--standards`: `docs/DOCUMENT_STANDARDS.md`
- `--scaffold`: 標準フォルダ構成

### check code

ソースコードの静的チェック（テストファイル存在、カバレッジ）を実行します。

```bash
docs-lint check code [オプション]
```

**オプション**:

| オプション | 説明 |
|-----------|------|
| `-s, --src-dir <path>` | ソースディレクトリ（デフォルト: `./src`） |
| `-v, --verbose` | 詳細出力 |
| `--json` | JSON形式で出力 |

### check spec

仕様書の静的チェック（構造、参照）を実行します。

```bash
docs-lint check spec [オプション]
```

**オプション**:

| オプション | 説明 |
|-----------|------|
| `-d, --docs-dir <path>` | ドキュメントディレクトリ（デフォルト: `./docs`） |
| `-v, --verbose` | 詳細出力 |
| `--json` | JSON形式で出力 |

### review code

AIによるコードレビュー（要件カバレッジ分析）のプロンプトを生成します。

```bash
docs-lint review code [オプション]
```

**オプション**:

| オプション | 説明 |
|-----------|------|
| `-d, --docs-dir <path>` | ドキュメントディレクトリ |
| `-s, --src-dir <path>` | ソースディレクトリ |
| `--api` | Anthropic APIを直接呼び出す |
| `--model <model>` | 使用するAIモデル（--api使用時） |
| `-v, --verbose` | 詳細出力 |
| `--json` | JSON形式で出力 |

### review spec

AIによる仕様書レビュー（MECEチェック含む）のプロンプトを生成します。

```bash
docs-lint review spec [オプション]
```

**オプション**:

| オプション | 説明 |
|-----------|------|
| `-d, --docs-dir <path>` | ドキュメントディレクトリ |
| `-s, --src-dir <path>` | ソースディレクトリ（設計・実装整合性チェック用） |
| `--design` | 設計・実装整合性に焦点を当てる |
| `--api` | Anthropic APIを直接呼び出す |
| `--model <model>` | 使用するAIモデル（--api使用時） |
| `-v, --verbose` | 詳細出力 |
| `--json` | JSON形式で出力 |

**MECEチェック**: v2.0で追加されたMECE（相互排他・完全網羅）チェックが含まれます。

- **相互排他性**: 仕様の重複、矛盾がないか
- **完全網羅性**: 機能、状態、エラーが網羅されているか

詳細は[MECEチェック仕様](../02-spec/03-specifications/MECE-CHECK.md)を参照してください。

### show standards

現在のドキュメント標準を表示します。

```bash
docs-lint show standards [オプション]
```

**オプション**:

| オプション | 説明 |
|-----------|------|
| `-d, --docs-dir <path>` | ドキュメントディレクトリ（デフォルト: `./docs`） |

### show config

現在の設定を表示します。

```bash
docs-lint show config [オプション]
```

**オプション**:

| オプション | 説明 |
|-----------|------|
| `-c, --config <path>` | 設定ファイルパス |
| `-d, --docs-dir <path>` | ドキュメントディレクトリ（デフォルト: `./docs`） |

### show rules

利用可能なルール一覧を表示します。

```bash
docs-lint show rules
```

## 終了コード

| コード | 説明 |
|--------|------|
| `0` | 全チェック合格 |
| `1` | 1つ以上のエラー検出 |

## 出力形式

### 人間が読みやすい形式（デフォルト）

```text
📄 Documentation Lint Results

Files checked: 15
Status: PASSED

Summary:
  Errors: 0
  Warnings: 3
  Passed: 8

✓ brokenLinks
⚠ todoComments (2 issues)
    README.md:45 Unresolved TODO: サンプルを追加
```

### JSON形式（--json）

```json
{
  "meta": {
    "generatedAt": "2026-02-18T00:00:00.000Z",
    "tool": "@gu-corp/docs-lint"
  },
  "summary": {
    "totalFiles": 15,
    "errors": 0,
    "warnings": 3,
    "passed": true
  },
  "issues": [...]
}
```

## v1.x からの移行

v2.0で以下のコマンドが変更されました：

| v1.x | v2.0 | 備考 |
|------|------|------|
| `init-standards` | `init --standards` | 統合 |
| `scaffold` | `init --scaffold` | 統合 |
| `show-standards` | `show standards` | サブコマンド化 |
| `check-structure` | `lint` | 統合（standardFolderStructureルール） |
| `check:code` | `check code` | スペース区切り |
| `check:spec` | `check spec` | スペース区切り |
| `review:code` | `review code` | スペース区切り |
| `review:spec` | `review spec` | スペース区切り |
| `sync` | 削除 | 不要と判断 |

**後方互換性**: v1.x形式のコマンドは非推奨警告を表示しつつ動作します（v3.0で削除予定）。

## トラブルシューティング

### 設定ファイルが読み込まれない

```bash
# 設定ファイルの場所を確認
ls -la docs-lint.config.json

# 明示的に設定ファイルを指定
docs-lint lint -c ./docs-lint.config.json

# 現在の設定を確認
docs-lint show config
```

### ESMエラーが発生する

```bash
# Node.jsバージョン確認（18以上が必要）
node --version

# package.jsonに"type": "module"があるか確認
```

---

## 関連ドキュメント

- [設定リファレンス](./CONFIGURATION.md)
- [ルールリファレンス](./RULES.md)
- [CI/CD設定](../04-development/CI-CD.md)
