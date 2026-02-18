# テストケース

**バージョン**: 1.18.0
**更新日**: 2026-02-18

---

## 概要

docs-lint のテストケースを定義します。

## テストケース一覧

### コンテンツルール

| ID | 対象要件 | テスト内容 | 期待結果 |
|----|---------|-----------|---------|
| TC-U001 | FR-CONTENT-001 | 有効な内部リンクを含むファイル | エラーなし |
| TC-U002 | FR-CONTENT-001 | 存在しないファイルへのリンク | エラー検出 |
| TC-U003 | FR-CONTENT-001 | 相対パスリンクの検証 | 正しく解決 |
| TC-U004 | FR-CONTENT-002 | `00-XXXX.md`形式のファイル | レガシー警告 |
| TC-U005 | FR-CONTENT-002 | 正常なファイル名 | エラーなし |
| TC-U006 | FR-CONTENT-003 | バージョン情報あり | エラーなし |
| TC-U007 | FR-CONTENT-003 | バージョン情報なし | 警告検出 |
| TC-U008 | FR-CONTENT-004 | 関連ドキュメントセクションあり | エラーなし |
| TC-U009 | FR-CONTENT-004 | 関連ドキュメントセクションなし | 警告検出 |
| TC-U010 | FR-CONTENT-005 | 正しい見出し階層（H1→H2→H3） | エラーなし |
| TC-U011 | FR-CONTENT-005 | 見出し階層スキップ（H1→H3） | エラー検出 |
| TC-U012 | FR-CONTENT-006 | `TODO`コメントを含むファイル | 警告検出 |
| TC-U013 | FR-CONTENT-006 | `FIXME`コメントを含むファイル | 警告検出 |
| TC-U014 | FR-CONTENT-007 | 言語指定ありのコードブロック | エラーなし |
| TC-U015 | FR-CONTENT-007 | 言語指定なしのコードブロック | 警告検出 |
| TC-U016 | FR-CONTENT-008 | どこからもリンクされていないファイル | 孤立警告 |
| TC-U017 | FR-CONTENT-009 | 用語の不統一（api vs API） | 警告検出 |

### 構造ルール

| ID | 対象要件 | テスト内容 | 期待結果 |
|----|---------|-----------|---------|
| TC-U020 | FR-STRUCT-001 | 標準フォルダ構成が存在 | エラーなし |
| TC-U021 | FR-STRUCT-001 | 必須フォルダ（01-plan）欠如 | エラー検出 |
| TC-U022 | FR-STRUCT-002 | 必須ファイル（README.md）存在 | エラーなし |
| TC-U023 | FR-STRUCT-002 | 必須ファイル欠如 | エラー検出 |
| TC-U028 | FR-STRUCT-003 | 必須ファイル一覧チェック | 正しく検出 |
| TC-U024 | FR-STRUCT-004 | 連番フォルダ（01, 02, 03） | エラーなし |
| TC-U025 | FR-STRUCT-004 | 欠番フォルダ（01, 03） | 警告検出 |
| TC-U026 | FR-STRUCT-005 | UPPER-CASE.md形式 | エラーなし |
| TC-U027 | FR-STRUCT-005 | lower-case.md形式 | 警告検出 |
| TC-U029 | FR-STRUCT-006 | テンプレートとの差分検出 | 差分報告 |

### 要件追跡ルール

| ID | 対象要件 | テスト内容 | 期待結果 |
|----|---------|-----------|---------|
| TC-U030 | FR-TRACE-001 | FR-001形式の要件ID | 正しく認識 |
| TC-U031 | FR-TRACE-001 | FR-AUTH-001形式の要件ID | 正しく認識 |
| TC-U032 | FR-TRACE-002 | TC-U001形式のテストID | 正しく認識 |
| TC-U033 | FR-TRACE-003 | 全要件にテストケース対応 | エラーなし |
| TC-U034 | FR-TRACE-003 | テストケース未定義の要件あり | 警告検出 |
| TC-U035 | FR-TRACE-004 | 要件カバレッジ率の計算 | 正しく計算 |

### CLI

| ID | 対象要件 | テスト内容 | 期待結果 |
|----|---------|-----------|---------|
| TC-I001 | FR-CLI-001 | docs-lint lint 実行 | 結果出力 |
| TC-I002 | FR-CLI-002 | docs-lint init 実行 | 設定ファイル生成 |
| TC-I003 | FR-CLI-003 | docs-lint init-standards 実行 | DOCUMENT_STANDARDS.md生成 |
| TC-I013 | FR-CLI-004 | docs-lint show-standards 実行 | 標準表示 |
| TC-I014 | FR-CLI-005 | docs-lint check-structure 実行 | 構成チェック |
| TC-I015 | FR-CLI-006 | docs-lint scaffold 実行 | フォルダ生成 |
| TC-I016 | FR-CLI-007 | `docs-lint review:spec` 実行 | AIレビュー |
| TC-I004 | FR-CLI-008 | --verbose オプション | 詳細出力 |
| TC-I005 | FR-CLI-009 | --json オプション | JSON出力 |
| TC-I006 | FR-CLI-010 | --ai-prompt オプション | プロンプト生成 |
| TC-I007 | FR-CLI-011 | --only brokenLinks | 指定ルールのみ実行 |
| TC-I008 | FR-CLI-012 | `--skip todoComments` | 指定ルールをスキップ |

### API

| ID | 対象要件 | テスト内容 | 期待結果 |
|----|---------|-----------|---------|
| TC-I010 | FR-API-001 | createLinter()呼び出し | インスタンス作成 |
| TC-I011 | FR-API-002 | linter.lint()呼び出し | LintResult返却 |
| TC-I012 | FR-API-003 | 個別ルール関数呼び出し | Issue[]返却 |
| TC-I017 | FR-API-004 | TypeScript型定義のエクスポート | 型が利用可能 |

### 設定

| ID | 対象要件 | テスト内容 | 期待結果 |
|----|---------|-----------|---------|
| TC-U040 | FR-CONFIG-001 | docs-lint.config.json読み込み | 設定適用 |
| TC-U041 | FR-CONFIG-002 | severity: "off" 設定 | ルール無効化 |
| TC-U042 | FR-CONFIG-002 | severity: "error" 設定 | エラーとして報告 |
| TC-U043 | FR-CONFIG-003 | exclude パターン設定 | 除外適用 |
| TC-U044 | FR-CONFIG-004 | terminology カスタム設定 | 用語チェック適用 |
| TC-U045 | FR-CONFIG-005 | requiredFiles 設定 | 必須ファイルチェック適用 |

### 出力

| ID | 対象要件 | テスト内容 | 期待結果 |
|----|---------|-----------|---------|
| TC-I020 | FR-OUTPUT-001 | 人間が読みやすい形式で出力 | 整形済み出力 |
| TC-I021 | FR-OUTPUT-002 | 終了コード0（成功時） | exit 0 |
| TC-I022 | FR-OUTPUT-002 | 終了コード1（エラー時） | exit 1 |
| TC-I023 | FR-OUTPUT-003 | サマリー表示 | エラー/警告/パス数表示 |
| TC-I024 | FR-OUTPUT-004 | ファイル名・行番号表示 | 問題箇所特定可能 |
| TC-I025 | FR-OUTPUT-005 | 修正サジェスチョン表示 | 修正案表示 |

### 非機能要件

| ID | 対象要件 | テスト内容 | 期待結果 |
|----|---------|-----------|---------|
| TC-P001 | NFR-001 | 100ファイルのリント実行 | 10秒以内に完了 |
| TC-I030 | NFR-002 | Node.js 18で実行 | 正常動作 |
| TC-I031 | NFR-003 | ESMインポートで利用 | 正常動作 |
| TC-I032 | NFR-004 | 依存パッケージ数 | 最小限を維持 |

## テスト実行

```bash
# 全テスト実行
npm test

# カバレッジ付き
npm test -- --coverage

# 特定テストのみ
npm test -- --grep "brokenLinks"
```

## カバレッジ目標

| 項目 | 目標 |
|------|------|
| 行カバレッジ | 80%以上 |
| 分岐カバレッジ | 70%以上 |
| 関数カバレッジ | 90%以上 |

---

## 関連ドキュメント

- [要件定義](../01-requirements/README.md)
- [アーキテクチャ設計](../02-architecture/ARCHITECTURE.md)
