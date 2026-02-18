# 詳細設計

**バージョン**: 2.0.0
**更新日**: 2026-02-18

---

## 概要

docs-lint の詳細設計ドキュメントを格納するフォルダです。各コンポーネントの実装詳細を記述します。

## コンテンツ

### 本フォルダ内

- [MECEチェック仕様](./MECE-CHECK.md) - v2.0で追加されたMECEチェック機能の詳細仕様
- [設定スキーマ仕様](./CONFIG-SCHEMA.md) - docs-lint.config.json の完全仕様

### 関連設計（02-architecture内）

- [クラス設計](../02-architecture/CLASS.md) - クラス構成と責務
- [エラー処理設計](../02-architecture/ERROR-HANDLING.md) - エラーハンドリング方針
- [API仕様](../02-architecture/API.md) - パブリックAPI定義

## 今後追加予定

- ルール実装詳細（各リントルールの判定ロジック）
- 出力フォーマット詳細（JSON/テキスト出力の構造）

---

## 関連ドキュメント

- [アーキテクチャ設計](../02-architecture/ARCHITECTURE.md)
- [要件定義](../01-requirements/README.md)
