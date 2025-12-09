# docs-lint ドキュメント

**バージョン**: 1.12.0
**更新日**: 2025-12-10

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
│   ├── 01-requirements/
│   │   └── REQUIREMENTS.md             # 要件定義
│   ├── 02-design/
│   │   ├── ARCHITECTURE.md             # アーキテクチャ設計
│   │   ├── CLASS.md                    # クラス設計
│   │   ├── ERROR-HANDLING.md           # エラー処理設計
│   │   └── API.md                      # API仕様
│   └── 04-testing/
│       └── TEST-CASES.md               # テストケース
├── 03-guide/                           # ガイド・マニュアル
│   ├── GETTING-STARTED.md              # はじめに
│   ├── CLI.md                          # CLIリファレンス
│   ├── CONFIGURATION.md                # 設定リファレンス
│   └── RULES.md                        # ルールリファレンス
└── 04-development/                     # 開発者向け
    ├── SETUP.md                        # 開発環境セットアップ
    └── CI-CD.md                        # CI/CD設定
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

### 仕様

- [要件定義](./02-spec/01-requirements/REQUIREMENTS.md) - 機能要件一覧
- [アーキテクチャ設計](./02-spec/02-design/ARCHITECTURE.md) - システム構成
- [API仕様](./02-spec/02-design/API.md) - プログラマティックAPI

## 主な機能

| 機能 | 説明 |
|------|------|
| リンク切れ検出 | 存在しないファイルへのリンクを検出 |
| レガシーファイル検出 | 非推奨の命名パターンを検出 |
| バージョン検証 | ドキュメントにバージョン情報があるかチェック |
| 見出し階層検証 | H1→H2→H3の正しい階層かチェック |
| TODO検出 | 未解決のTODO/FIXMEコメントを検出 |
| コードブロック言語 | 言語指定があるかチェック |
| 孤立ドキュメント検出 | どこからもリンクされていないファイルを検出 |
| 用語統一 | 設定した用語が統一されているかチェック |
| フォルダ構成検証 | G.U.Corp標準構成に従っているかチェック |
| 要件追跡 | FR-XXX ↔ TC-XXX の対応をチェック |
| AI向け出力 | AI評価用のプロンプトを生成 |

---

## 関連ドキュメント

- [プロジェクト提案書](./01-plan/PROPOSAL.md)
- [はじめに](./03-guide/GETTING-STARTED.md)
