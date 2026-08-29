# docs-lint v3 ロードマップ

## 現在のリリース境界

v3.0 は、Standard Pack、ルールレジストリ、Node アダプター、安定した診断 JSON、文書生成 CLI を提供します。v2 の AI/API 呼出し、コードレビュー、暗黙の G.U. 固有規約は対象外です。

## 次期候補

| 優先度 | 項目 | 完了条件 |
| --- | --- | --- |
| High | v2 ルールの復元 | [v3 機能復元計画](V3-RESTORATION.md) の Phase 1〜3 が完了し、gu-coin-suite の v2 設定を v3 で置き換えられる |
| High | Lunascape Docs 統合 | 共通 config、validate on save、診断表示が動く |
| High | Pack 作成支援 | manifest 初期化、Schema 補完、Pack 単体テストが使える |
| Medium | safe fixes | preview と明示承認後だけ Markdown を変更する |
| Medium | AI review adapter | ベンダー非依存の入力・出力契約と明示的なデータ送信境界を持つ |
| Medium | i18n traceability | 正本と翻訳の ID・構造・更新差分を検出する |
| Low | SARIF formatter | GitHub code scanning へ診断を公開できる |

## 判断原則

新機能はコア、Node アダプター、CLI、Standard Pack のどこに属するかを先に決めます。特定組織の規約をコアルールへ直書きしません。
