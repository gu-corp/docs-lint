# ロードマップ

**バージョン**: 1.0
**更新日**: 2025-12-10

---

## 概要

docs-lint の開発ロードマップです。

## 現在のバージョン: v1.12.0

### v1.0（リリース済み）

- [x] 基本的なリントルール実装
  - brokenLinks, legacyFileNames, versionInfo, headingHierarchy
  - todoComments, codeBlockLanguage, orphanDocuments, terminology
- [x] CLI インターフェース（lint, init, init-standards）
- [x] 設定ファイル対応（docs-lint.config.json）
- [x] AI向けプロンプト生成（--ai-prompt）

### v1.5〜v1.12（リリース済み）

- [x] 標準フォルダ構成チェック（standardFolderStructure）
- [x] フォルダ番号付けチェック（folderNumbering）
- [x] 要件・テストケースマッピング（requirementTestMapping）
- [x] scaffoldコマンド追加
- [x] review:specコマンド追加
- [x] ドキュメント標準規約（DOCUMENT_STANDARDS.md）のテンプレート強化
  - AI向けプロンプト（4つのペルソナ）
  - UML.md必須化
  - テスト仕様の詳細規約
  - 01-plan / 02-spec の役割分担
  - コーディング標準（AI向けルール含む）

## v2.0（計画中）

- [ ] syncコマンド: 標準テンプレートの同期
- [ ] standardsDrift ルール: テンプレートとの差分検出
- [ ] watch モード: ファイル変更時の自動リント
- [ ] VSCode拡張: リアルタイムエラー表示

## v3.0（構想）

- [ ] ドキュメント生成支援（AIプロンプト最適化）
- [ ] 多言語翻訳状態の追跡
- [ ] カスタムルール定義のサポート
- [ ] レポート出力（HTML/PDF）

---

## 関連ドキュメント

- [プロジェクト提案書](./PROPOSAL.md)
- [要件定義](../02-spec/01-requirements/REQUIREMENTS.md)
