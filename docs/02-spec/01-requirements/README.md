# 要件定義

**バージョン**: 2.0.0
**更新日**: 2026-02-18

---

## 概要

docs-lint の要件定義を管理します。このフォルダには、ビジネス要件、機能要件、非機能要件、統合要件を分類して配置しています。

## フォルダ構成

```text
01-requirements/
├── 00-business/       # ビジネス要件・目的
├── 01-functional/     # 機能要件
├── 02-non-functional/ # 非機能要件（性能、セキュリティ等）
├── 03-integration/    # 統合・連携要件
├── 04-reference/      # 参照ドキュメント
├── index.md           # 要件インデックス
└── README.md          # このファイル
```

## 要件ID体系

| 接頭辞 | カテゴリ | 例 |
|--------|----------|-----|
| BR- | ビジネス要件 | BR-001 |
| FR- | 機能要件 | FR-CONTENT-001 |
| NFR- | 非機能要件 | NFR-001 |
| IR- | 統合要件 | IR-001 |

## クイックリンク

- [要件インデックス](./REQUIREMENTS.md) - 全要件の一覧
- [機能要件](./01-functional/REQUIREMENTS.md) - 機能要件詳細
- [非機能要件](./02-non-functional/REQUIREMENTS.md) - 非機能要件詳細
- [統合要件](./03-integration/REQUIREMENTS.md) - 統合要件詳細

---

## 関連ドキュメント

- [プロジェクト提案書](../../01-plan/PROPOSAL.md)
- [アーキテクチャ設計](../02-architecture/ARCHITECTURE.md)
- [テストケース](../04-testing/TEST-CASES.md)
