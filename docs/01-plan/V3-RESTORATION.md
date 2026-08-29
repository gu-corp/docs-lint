---
navigation:
  order: 200
---

# v3 機能復元計画

**作成日**: 2026-08-30

## 背景

v3（`849d109`, 2026-08-28）は v2 を Standard Pack とルールレジストリに作り直したが、その際に v2 の多くのルールが「必要性と境界を再定義してから追加する」として引き継がれなかった（[MIGRATION-V3](../03-guide/MIGRATION-V3.md)）。実際の利用先（`gu-coin-suite/products/gu-coin-studio-exchange`）の設定は v2 のほぼ全ルールを有効にしていたため、v3 では利用者が期待する検査の大半が動いていない。

本計画は v2 の機能を棚卸しし、v3 の設計原則（副作用のない純ルール、組織固有規約は Pack へ、コアに AI/API 依存を持たない）の中で復元する順序を定める。

## 棚卸し

| v2 ルール／機能 | 内容 | v3 の状態 | 復元 |
| --- | --- | --- | --- |
| brokenLinks | 内部リンク切れ | `links/internal` | 済 |
| headingHierarchy | 見出し階層 | `markdown/headings` | 済 |
| codeBlockLanguage | コードブロック言語 | `markdown/code-fence-language` | 済 |
| terminology | 用語統一（`exceptions`, `wordBoundary`） | `content/terminology`。`exceptions`/`wordBoundary` 未対応 | Phase 2 |
| requirementTestMapping | 要件↔テスト対応、TC 分類（U/I/E/P/S/D/X）、明示対応 `TC-x [FR-y]`、ID 欠落・テスト文書欠落・カバレッジ | `traceability/requirements-tests`。ID 単位の対応と閾値のみ | **Phase 1** |
| （要件 ID 命名規則） | `FR-XXX-001` 形式の逸脱・重複 | なし | **Phase 1**（`traceability/requirement-ids`） |
| （要件参照の整合） | 設計・テスト・状況表が参照する要件 ID が要件文書に存在するか | なし | **Phase 1**（`traceability/requirement-references`） |
| requirementsCoverage | 設定型のみ存在し実装なし | なし | 対象外（v2 でも未実装） |
| standardFolderStructure / requiredFiles | 標準フォルダ・必須文書 | `structure/standard-pack`（Pack 定義に移行） | 済 |
| （必須章） | 文書種別ごとの必須見出し | `document/required-sections`（v3 新規） | 済 |
| todoComments | TODO/FIXME/BUG のタグ別重要度 | なし | Phase 2 |
| versionInfo | バージョン表記の有無 | なし | Phase 2（Pack の文書種別で必須メタデータとして表現） |
| relatedDocuments | 関連ドキュメント節の有無 | なし | Phase 2（必須章として Pack で表現可能） |
| orphanDocuments | どこからも参照されない文書 | なし | Phase 2（`links/orphans`） |
| bidirectionalRefs | 相互参照の欠落 | なし | Phase 2（`links/bidirectional`、既定 off） |
| legacyFileNames / fileNaming / standardFileNames | ファイル命名規則 | なし | Phase 3（`structure/file-naming`、規則は Pack へ） |
| folderNumbering | フォルダ番号の連番 | なし | Phase 3（`structure/folder-numbering`） |
| duplicateContent | 重複内容 | なし | Phase 3（要精査） |
| standardsDrift | 標準テンプレートとの差分 | なし | Phase 3（Pack テンプレートとの差分として再定義） |
| i18nStructure | 翻訳の欠落・孤立・版ずれ・構造ずれ | なし（Lunascape Docs 側に coverage あり） | Phase 4（`i18n/coverage` として共通化） |
| markdownLint（`--fix`） | markdownlint 連携と自動修正 | なし | Phase 4（optional adapter。コアの依存にしない） |
| check code / TestingConfig | テストファイル有無・カバレッジ | なし | 対象外（文書 lint の範囲外。別ツール） |
| review code / review spec / MECE / `--ai-prompt` | AI レビュー | なし | Phase 5（Editor の翻訳プロバイダ境界を再利用する adapter。コアには入れない） |
| scaffold / show | 雛形生成・情報表示 | `create` と Pack テンプレートに移行 | 済 |

## Phase 1（要件トレーサビリティ）

1. `traceability/requirements-tests` を v2 相当へ拡張する。
   - 既定のファイル検出を広げる（`**/*REQUIREMENTS*.md`, `**/01-requirements/**`, `**/*TEST*.md`, `**/*-TESTS.md`, `**/0?-testing/**`）。
   - TC 分類: `TC-D…`（延期）だけが対応するときは info、`TC-X…`（対象外）だけのときは分母から除外する。
   - `requireTestFile` / `requireRequirementIds` / `requireTestCaseIds` を追加する（既定 on）。
   - 診断は要件定義行に付ける（済）。
2. `traceability/requirement-ids` を追加する。要件文書で規則に合わない ID（`FR001`, `fr-001`, `FR_001` など）と、表の行頭・見出しで重複定義された ID を報告する。
3. `traceability/requirement-references` を追加する。要件文書以外が参照する要件 ID が、どの要件文書にも存在しない場合に報告する。
4. `docs-lint.config.json` schema に上記オプションと説明を追加し、Editor のルール名・説明を更新する。

完了条件: 上記ルールの単体テスト、Editor runtime の再同梱、Lunascape Docs のルールタブでの表示。

## Phase 2 以降

Phase 2（内容ルール）→ Phase 3（構造ルール）→ Phase 4（i18n・markdownlint adapter）→ Phase 5（AI review adapter）の順に進める。各 Phase の開始時に本表を更新する。組織固有の既定値（命名規則、フォルダ番号、TC 分類）は Pack manifest の `rules` と options で表現し、コアには既定の汎用値だけを置く。
