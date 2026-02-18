# docs-lint ドキュメント

**バージョン**: 2.0.0
**更新日**: 2026-02-18

---

## 概要

docs-lint は、G.U.Corp プロジェクトのドキュメント構造・品質・一貫性を検証するリントツールです。自動チェックとAI向け出力を提供し、ドキュメント品質の維持を支援します。

## ドキュメント構成

```text
docs/
├── README.md                           # このファイル（目次）
├── 01-plan/                            # 企画・計画
│   ├── PROPOSAL.md                     # プロジェクト提案書
│   └── ROADMAP.md                      # ロードマップ
├── 02-spec/                            # 仕様書
│   ├── 01-requirements/                # 要件定義
│   │   ├── 00-business/                # ビジネス要件
│   │   ├── 01-functional/              # 機能要件
│   │   ├── 02-non-functional/          # 非機能要件
│   │   ├── 03-integration/             # 統合要件
│   │   ├── 04-reference/               # 参照ドキュメント
│   │   ├── index.md                    # 要件インデックス
│   │   └── README.md
│   ├── 02-architecture/                # アーキテクチャ設計
│   │   ├── ARCHITECTURE.md
│   │   ├── CLASS.md
│   │   ├── ERROR-HANDLING.md
│   │   ├── API.md
│   │   └── UML.md
│   ├── 03-specifications/              # 詳細設計
│   ├── 04-testing/                     # テスト仕様
│   │   └── TEST-CASES.md
│   └── 05-reference/                   # 参照資料
├── 03-guide/                           # ガイド・マニュアル
│   ├── GETTING-STARTED.md              # はじめに
│   ├── CLI.md                          # CLIリファレンス
│   ├── CONFIGURATION.md                # 設定リファレンス
│   └── RULES.md                        # ルールリファレンス
└── 04-development/                     # 開発者向け
    ├── SETUP.md                        # 開発環境セットアップ
    ├── CI-CD.md                        # CI/CD設定
    ├── CODING-STANDARDS.md             # コーディング規約
    ├── TESTING.md                      # テスト方針
    └── GIT-WORKFLOW.md                 # Gitワークフロー
```

## クイックリンク

### 利用者向け

- [はじめに](./03-guide/GETTING-STARTED.md) - インストールと初回実行
- [CLIリファレンス](./03-guide/CLI.md) - コマンドラインオプション
- [設定リファレンス](./03-guide/CONFIGURATION.md) - 設定ファイルの書き方
- [ルールリファレンス](./03-guide/RULES.md) - 利用可能なルール一覧

### 開発者向け

- [開発環境セットアップ](./04-development/SETUP.md) - ローカル開発環境の構築
- [CI/CD設定](./04-development/CI-CD.md) - GitHub Actions統合
- [Gitワークフロー](./04-development/GIT-WORKFLOW.md) - ブランチ戦略

### 仕様

- [要件定義](./02-spec/01-requirements/REQUIREMENTS.md) - 要件インデックス
- [機能要件](./02-spec/01-requirements/01-functional/REQUIREMENTS.md) - 機能要件一覧
- [アーキテクチャ設計](./02-spec/02-architecture/ARCHITECTURE.md) - システム構成
- [API仕様](./02-spec/02-architecture/API.md) - プログラマティックAPI

## 主な機能

| 機能 | 説明 | バージョン |
|------|------|----------|
| リンク切れ検出 | 存在しないファイルへのリンクを検出 | v1.0 |
| レガシーファイル検出 | 非推奨の命名パターンを検出 | v1.0 |
| バージョン検証 | ドキュメントにバージョン情報があるかチェック | v1.0 |
| 見出し階層検証 | H1→H2→H3の正しい階層かチェック | v1.0 |
| TODO検出 | 未解決のTODO/FIXMEコメントを検出 | v1.0 |
| コードブロック言語 | 言語指定があるかチェック | v1.0 |
| 孤立ドキュメント検出 | どこからもリンクされていないファイルを検出 | v1.0 |
| 用語統一 | 設定した用語が統一されているかチェック | v1.0 |
| フォルダ構成検証 | G.U.Corp標準構成に従っているかチェック | v1.7 |
| 要件追跡 | FR-XXX ↔ TC-XXX の対応をチェック | v1.4 |
| AI向け出力 | AI評価用のプロンプトを生成 | v1.0 |
| 自動修正 | マークダウンフォーマットの自動修正 | v1.14 |
| 用語例外設定 | 用語チェックの例外パターン設定 | v1.18 |
| アーカイブ除外 | アンダースコアで始まるフォルダ/ファイルの自動除外 | v1.17 |

---

## 関連ドキュメント

- [プロジェクト提案書](./01-plan/PROPOSAL.md)
- [はじめに](./03-guide/GETTING-STARTED.md)
