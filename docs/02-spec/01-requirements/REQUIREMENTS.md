---
documentType: system-requirements
version: 3.1.1
status: Approved for implementation
canonicalLocale: ja
---

# docs-lint v3 要件定義書

## 目的

複数プロダクトの Markdown/MDX 文書を、プロダクト固有の事情と組織共通の文書標準を分離したまま検証・生成できる仕組みを提供する。CI、Lunascape Doc Editor、将来の AI review が同じ設定と診断契約を利用できる状態を作る。

## 対象範囲

### 対象

- Markdown/MDX 文書の探索と読込
- 登録型ルールエンジンによる決定的な検証
- Document Standard Pack の読込、profile 継承、テンプレート生成
- CLI と TypeScript API
- Lunascape Doc Editor と共有できる Standard Pack 選択

### 対象外

- WYSIWYG/Markdown の描画と編集
- Git commit、push、Issue 登録
- v3 コアからの外部 AI API 呼出し
- v2 CLI/API の互換レイヤー

## ステークホルダー

| 役割 | 主な関心 |
| --- | --- |
| 文書責任者 | 要件・仕様の完全性、正本、承認状態 |
| 開発者 | 高速なローカル検証、明確な修正箇所 |
| 品質保証 | 要件とテストの追跡、CI の安定性 |
| 標準管理者 | Pack の版管理、組織規約とプロダクト設定の分離 |
| Editor 利用者 | 同一 config、保存時検証、生成テンプレート |

## 機能要件

| ID | 要件 | 受入条件 |
| --- | --- | --- |
| SR-CORE-001 | ルールを `domain/name` ID で登録できる | 重複 ID と非 namespaced ID を拒否する |
| SR-CORE-002 | 各ルールの失敗を他ルールから隔離する | 例外を診断へ変換し、残りのルールを実行する |
| SR-CORE-003 | 診断レポートを安定した JSON schema で返す | schemaVersion、件数、severity、file、location を含む |
| SR-CFG-001 | v3 設定を明示的に識別する | `schemaVersion: 3` がない v2 設定をエラーにする |
| SR-CFG-002 | 設定、profile、Pack、rule default の優先順位を固定する | project > profile > Pack > rule default の順になる |
| SR-CFG-003 | Editor と Standard Pack 選択を共有できる | `lunascape-docs.json.documentStandards` を読める |
| SR-PACK-001 | JSON manifest と Markdown template から Pack を構成できる | executable code を Pack に要求しない |
| SR-PACK-002 | profile の多重継承を解決できる | 参照欠落と循環を検出する |
| SR-PACK-003 | template の変数を安全に展開できる | eval を使わず、必須・未解決変数を拒否する |
| SR-PACK-004 | Pack 外のファイル参照を拒否する | path traversal と symlink escape を拒否する |
| SR-PACK-005 | 既存文書を暗黙に上書きしない | `create` は既存 target で失敗し、`--force` のみ許可する |
| SR-LINT-001 | 内部文書リンク切れを検出する | 相対 Markdown link の欠落と root escape を報告する |
| SR-LINT-002 | 見出し構造を検証する | H1 欠落・重複と階層飛びを報告する |
| SR-LINT-003 | fenced code block の言語指定を検証する | 未指定 fence の file と line を報告する |
| SR-LINT-004 | 非推奨語を検出する | Pack と project terminology を統合する |
| SR-LINT-005 | Pack が要求する構造と文書を検証する | 必須 folder と requiredDocuments の欠落を報告する |
| SR-LINT-006 | 文書種別の必須セクションを検証する | front matter または suggestedPath から種別を決める |
| SR-TRACE-001 | 要件 ID とテスト参照を検証する | 未参照要件と test case ID 欠落を報告する |
| SR-TRACE-002 | 最低カバレッジを設定できる | 0〜1 の閾値未満を診断する |
| SR-CLI-001 | lint を人間向け・JSON で出力できる | error があれば exit code 1 にする |
| SR-CLI-002 | Pack を一覧・検証・表示できる | `pack list/validate/show` が動く |
| SR-CLI-003 | v2 設定の変換案を生成できる | 元ファイルを上書きせず、要レビューの v3 ファイルを作る |

## 非機能要件

| ID | 分類 | 要件 | 検証 |
| --- | --- | --- | --- |
| SR-NFR-001 | Runtime | Node.js 20 以上の ESM として動作する | CI matrix と package engines |
| SR-NFR-002 | Security | Pack path を root 内へ制限し、テンプレートを実行しない | traversal/symlink test |
| SR-NFR-003 | Determinism | 同一入力・設定から診断内容と順序が安定する | fixture snapshot/test |
| SR-NFR-004 | Maintainability | CLI command、rule、filesystem adapter を分離する | architecture boundary review |
| SR-NFR-005 | Dependency | runtime dependency の既知脆弱性を残さない | `npm audit --omit=dev` |
| SR-NFR-006 | Compatibility | v3 の schema と report を version field で識別する | schema validation test |
| SR-NFR-007 | Distribution | Editor runtime に同梱する第三者コードの通知とライセンス原文を package に収録する | build smoke と package dry-run |

## セキュリティ要件

| ID | 要件 |
| --- | --- |
| SR-SEC-001 | project root および Pack root を越える相対パスを拒否する |
| SR-SEC-002 | symlink の実体が Pack root 外なら template として読まない |
| SR-SEC-003 | template 展開で式評価、shell 実行、任意 module load を行わない |
| SR-SEC-004 | AI 連携をコアへ内蔵せず、外部送信は将来 adapter で明示する |
| SR-SEC-005 | 診断に環境変数や文書本文全体を暗黙に含めない |
| SR-SEC-006 | Editor session が読む設定と Pack 参照ファイルは、symlink の実体を workspace または Pack の許可境界内に限定する |

## 外部インターフェース

| ID | Interface | 契約 |
| --- | --- | --- |
| IF-001 | `docs-lint.config.json` | docs-lint v3 JSON Schema |
| IF-002 | `pack.json` | Document Standard Pack schema v1 |
| IF-003 | `lunascape-docs.json` | `documentStandards.pack/profile` |
| IF-004 | CLI JSON | LintReport schemaVersion 1 |
| IF-005 | TypeScript API | package exports に明示した v3 API |

## 業務要件との対応

| システム要件 | 利用価値 | テスト |
| --- | --- | --- |
| SR-PACK-001〜005 | プロダクト横断で規約と雛形を再利用できる | Standard Pack tests |
| SR-LINT-001〜006 | 顧客提示前の構造・記述不備を自動検出できる | Engine/workspace tests |
| SR-TRACE-001〜002 | 要件から検証証跡まで追跡できる | Traceability rule tests |
| SR-CFG-003 | Editor と CI の設定差異を減らせる | Config integration tests |
