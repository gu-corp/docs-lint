# CLIリファレンス

**バージョン**: 1.18.0
**更新日**: 2026-02-18

---

## 概要

docs-lint のコマンドラインインターフェースについて説明します。

## コマンド一覧

| コマンド | 説明 |
|----------|------|
| `lint` | ドキュメントのリントを実行 |
| `init` | 設定ファイルを対話形式で生成 |
| `init-standards` | DOCUMENT_STANDARDS.mdを生成 |
| `show-standards` | 現在の標準を表示 |
| `check-structure` | フォルダ構成をチェック |
| `scaffold` | 標準フォルダ構成を生成 |
| `check:code` | ソースコードの静的チェック |
| `check:spec` | 仕様書の静的チェック |
| `review:code` | AIによるコードレビュー |
| `review:spec` | AIによる仕様書レビュー |

## コマンド詳細

### lint

ドキュメントのリントを実行します。

```bash
npx docs-lint lint [オプション]
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
| `--fix` | マークダウンフォーマットを自動修正（v1.14.0+） |

**使用例**:

```bash
# 基本的なリント
npx docs-lint lint

# ディレクトリ指定
npx docs-lint lint -d ./documentation

# 詳細出力
npx docs-lint lint -v

# 特定ルールのみ実行
npx docs-lint lint --only brokenLinks,todoComments

# 特定ルールをスキップ
npx docs-lint lint --skip terminology,orphanDocuments

# JSON出力
npx docs-lint lint --json

# AIプロンプト生成
npx docs-lint lint --ai-prompt > report.md

# 自動修正
npx docs-lint lint --fix
```

**ユースケース**:

| シナリオ | コマンド |
|----------|----------|
| PR前のクイックチェック | `npx docs-lint lint` |
| CI/CDパイプライン | `npx docs-lint lint --json` |
| AIレビュー準備 | `npx docs-lint lint --ai-prompt > report.md` |
| フォーマット修正 | `npx docs-lint lint --fix` |
| デバッグ時 | `npx docs-lint lint -v --only brokenLinks` |

### init

対話形式で設定ファイルを生成します。

```bash
npx docs-lint init [オプション]
```

**オプション**:

| オプション | 説明 |
|-----------|------|
| `-d, --docs-dir <path>` | ドキュメントディレクトリ（デフォルト: `./docs`） |
| `-y, --yes` | ウィザードをスキップ、デフォルト値を使用 |

**使用例**:

```bash
# 対話形式セットアップ
npx docs-lint init

# デフォルト値で作成
npx docs-lint init -y
```

**生成されるファイル**:

- `docs-lint.config.json` - リントルール設定
- `docs/docs.config.json` - 言語設定

### init-standards

G.U.Corp標準テンプレートからDOCUMENT_STANDARDS.mdを生成します。

```bash
npx docs-lint init-standards [オプション]
```

**オプション**:

| オプション | 説明 |
|-----------|------|
| `-d, --docs-dir <path>` | ドキュメントディレクトリ（デフォルト: `./docs`） |
| `-f, --force` | 既存ファイルを上書き |

**使用例**:

```bash
# 標準ファイル作成
npx docs-lint init-standards

# 上書き
npx docs-lint init-standards --force
```

### show-standards

現在のドキュメント標準を表示します。

```bash
npx docs-lint show-standards [オプション]
```

**オプション**:

| オプション | 説明 |
|-----------|------|
| `-d, --docs-dir <path>` | ドキュメントディレクトリ（デフォルト: `./docs`） |

### check-structure

フォルダ構成と命名規則をチェックします。

```bash
npx docs-lint check-structure [オプション]
```

**オプション**:

| オプション | 説明 |
|-----------|------|
| `-d, --docs-dir <path>` | ドキュメントディレクトリ（デフォルト: `./docs`） |
| `--numbered` | 番号付きフォルダ（01-, 02-等）を期待 |
| `--upper-case` | UPPER_CASE.md形式を期待 |

**使用例**:

```bash
# 番号付きフォルダチェック
npx docs-lint check-structure --numbered

# 大文字ファイル名チェック
npx docs-lint check-structure --upper-case

# 両方チェック
npx docs-lint check-structure --numbered --upper-case
```

### scaffold

標準フォルダ構成を生成します。

```bash
npx docs-lint scaffold [オプション]
```

**オプション**:

| オプション | 説明 |
|-----------|------|
| `-d, --docs-dir <path>` | ドキュメントディレクトリ（デフォルト: `./docs`） |
| `--with-templates` | テンプレートファイルを含める |
| `--dry-run` | 実行せずプレビューのみ |

**使用例**:

```bash
# 標準構成を生成
npx docs-lint scaffold -d ./docs

# テンプレート込みで生成
npx docs-lint scaffold -d ./docs --with-templates

# プレビュー
npx docs-lint scaffold -d ./docs --dry-run
```

### check:code

ソースコードの静的チェック（テストファイル存在、カバレッジ）を実行します。

```bash
npx docs-lint check:code [オプション]
```

**オプション**:

| オプション | 説明 |
|-----------|------|
| `-s, --src-dir <path>` | ソースディレクトリ（デフォルト: `./src`） |

### check:spec

仕様書の静的チェック（構造、参照）を実行します。

```bash
npx docs-lint check:spec [オプション]
```

**オプション**:

| オプション | 説明 |
|-----------|------|
| `-d, --docs-dir <path>` | ドキュメントディレクトリ（デフォルト: `./docs`） |

### review:code

AIによるコードレビューを実行します。`ANTHROPIC_API_KEY`環境変数が必要です。

```bash
npx docs-lint review:code [オプション]
```

**オプション**:

| オプション | 説明 |
|-----------|------|
| `-d, --docs-dir <path>` | ドキュメントディレクトリ |
| `-s, --src-dir <path>` | ソースディレクトリ |

### review:spec

AIによる仕様書レビューを実行します。`ANTHROPIC_API_KEY`環境変数が必要です。

```bash
npx docs-lint review:spec <file> [オプション]
```

**オプション**:

| オプション | 説明 |
|-----------|------|
| `--type <type>` | ドキュメントタイプ（requirements, design, test等） |

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

### AIプロンプト（--ai-prompt）

AI評価用の構造化マークダウンを生成します：

- ドキュメント標準
- リント結果
- 品質チェックリスト

## トラブルシューティング

### 設定ファイルが読み込まれない

```bash
# 設定ファイルの場所を確認
ls -la docs-lint.config.json

# 明示的に設定ファイルを指定
npx docs-lint lint -c ./docs-lint.config.json
```

### ESMエラーが発生する

```bash
# package.jsonに"type": "module"があるか確認
# Node.js 18以上を使用しているか確認
node --version
```

### 特定のファイルを除外したい

```json
{
  "exclude": ["**/drafts/**", "**/archive/**", "**/_*.md"]
}
```

---

## 関連ドキュメント

- [設定リファレンス](./CONFIGURATION.md)
- [ルールリファレンス](./RULES.md)
- [CI/CD設定](../04-development/CI-CD.md)
