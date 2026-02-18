# 参照資料

**バージョン**: 1.18.0
**更新日**: 2026-02-18

---

## 概要

docs-lint の開発・運用に関連する参照資料をまとめています。

## 外部ドキュメント

### 使用ライブラリ

| ライブラリ | 用途 | ドキュメント |
|-----------|------|-------------|
| Commander.js | CLI構築 | [公式ドキュメント](https://github.com/tj/commander.js) |
| glob | ファイルマッチング | [npm](https://www.npmjs.com/package/glob) |
| chalk | ターミナル装飾 | [npm](https://www.npmjs.com/package/chalk) |
| markdownlint | Markdownリント | [ルール一覧](https://github.com/DavidAnson/markdownlint/blob/main/doc/Rules.md) |

### Markdown仕様

- [CommonMark Spec](https://commonmark.org/)
- [GitHub Flavored Markdown](https://github.github.com/gfm/)

### G.U.Corp標準

- ドキュメント標準（DOCUMENT_STANDARDS.md）
- 標準フォルダ構成
- 命名規則

## 類似ツール比較

| ツール | 対象 | 特徴 |
|--------|------|------|
| markdownlint | Markdownフォーマット | 54ルール、VS Code拡張 |
| remark-lint | Markdownリント | プラグイン豊富 |
| textlint | 自然言語 | 日本語校正対応 |
| **docs-lint** | ドキュメント構造 | フォルダ構成、要件追跡 |

## 用語集

| 用語 | 英語 | 説明 |
|------|------|------|
| リント | Lint | 静的解析による品質チェック |
| 重要度 | Severity | ルールの重要度（off/warn/error） |
| 孤立ドキュメント | Orphan Document | どこからもリンクされていないファイル |
| 要件追跡 | Requirements Tracing | 要件IDとテストケースIDの対応管理 |
| フォルダ番号付け | Folder Numbering | 01-plan, 02-spec形式の番号付け |

---

## 関連ドキュメント

- [要件定義](../01-requirements/README.md)
- [アーキテクチャ設計](../02-architecture/ARCHITECTURE.md)
