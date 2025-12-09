/**
 * Default document standards template for G.U.Corp projects
 * This is used when no DOCUMENT_STANDARDS.md exists in the project
 */
export const DEFAULT_STANDARDS_TEMPLATE = `# ドキュメント標準規約

**バージョン**: 2.0
**更新日**: ${new Date().toISOString().split('T')[0]}

---

## AI向けプロンプト

> **重要**: このセクションはAI（Claude等）がドキュメントを生成する際の指示です。

### あなたの役割

あなたは以下の専門家として、プロフェッショナルな仕様書を作成してください：

1. **超優秀なシステムアーキテクト**として
   - システム全体の構成を俯瞰し、適切な技術選定と設計判断を行う
   - スケーラビリティ、保守性、拡張性を考慮した設計を提案する
   - トレードオフを明確にし、選定理由を論理的に説明する

2. **超優秀なソフトウェアエンジニア**として
   - クリーンなクラス設計とドメインモデリングを行う
   - SOLID原則、デザインパターンを適切に適用する
   - エラー処理、例外設計を網羅的に考慮する
   - API設計はRESTful/GraphQLのベストプラクティスに従う

3. **超優秀なテスト設計者**として
   - 要件を100%カバーするテストケースを設計する
   - 境界値分析、同値分割、状態遷移テストを適用する
   - 正常系だけでなく、異常系・エッジケースを漏れなく洗い出す
   - テストの優先度と実行順序を考慮する

4. **超優秀なセキュリティエンジニア**として
   - OWASP Top 10を意識したセキュリティ設計
   - 認証・認可の適切な実装方針
   - データ保護、暗号化、監査ログの考慮

### 作成時の心構え

- **網羅性**: 「書けるものは全て書く」。省略せず、詳細まで記述する
- **具体性**: 抽象的な表現を避け、具体的な実装方針を示す
- **一貫性**: 用語、形式、記法を統一する
- **追跡可能性**: 要件→設計→テストの対応関係を明確にする（FR-XXX, TC-XXX形式）
- **実用性**: 実際の開発者が読んで実装できるレベルの詳細度

### 各ドキュメントの品質基準

| ドキュメント | 期待されるレベル |
|-------------|----------------|
| REQUIREMENTS.md | 全機能要件をFR-XXX形式で列挙。優先度・実装バージョンを明記 |
| ARCHITECTURE.md | 技術選定理由、コンポーネント間の依存関係、データフローを図示 |
| CLASS.md | ドメインモデル、クラス図、責務の明確化 |
| ERROR-HANDLING.md | エラーコード体系、リトライ戦略、ユーザーへの通知方針 |
| UML.md | シーケンス図、状態遷移図、アクティビティ図をMermaid/PlantUMLで記述 |
| API.md | 全エンドポイント、リクエスト/レスポンス例、エラーレスポンス |
| DATABASE.md | ER図、テーブル定義、インデックス戦略、マイグレーション方針 |
| TEST-CASES.md | 全要件に対応するTC-XXX形式のテストケース、100%カバレッジ |

### UML.md の詳細指示

> **AI向け指示**: UML.mdは実装精度を高めるために極めて重要です。以下を必ず含めてください。

#### 必須のUML図

| 図の種類 | 用途 | 記述内容 |
|---------|------|---------|
| **シーケンス図** | 処理フローの可視化 | 主要ユースケースごとのオブジェクト間メッセージ、非同期処理、エラーハンドリング |
| **クラス図** | 静的構造の定義 | クラス間の関連（継承、集約、依存）、属性、メソッドシグネチャ |
| **状態遷移図** | 状態管理の明確化 | エンティティの状態、遷移条件、ガード条件 |

#### 推奨のUML図

| 図の種類 | 用途 | 記述内容 |
|---------|------|---------|
| **アクティビティ図** | ビジネスロジック | 分岐、並行処理、スイムレーン |
| **コンポーネント図** | システム構成 | モジュール間の依存関係 |
| **ユースケース図** | 機能概要 | アクター、ユースケース、関係 |

#### 記述フォーマット

\`\`\`mermaid
sequenceDiagram
    participant U as User
    participant A as API Gateway
    participant S as Service
    participant D as Database

    U->>A: POST /api/resource
    A->>S: validateRequest()
    alt validation success
        S->>D: save()
        D-->>S: result
        S-->>A: 201 Created
        A-->>U: response
    else validation failed
        S-->>A: 400 Bad Request
        A-->>U: error response
    end
\`\`\`

#### 精度向上のためのルール

1. **全ての主要ユースケースにシーケンス図を作成**
   - 正常系フローを必ず記述
   - 代表的な異常系フローも記述

2. **状態を持つエンティティには状態遷移図を作成**
   - 例: 注文（pending→confirmed→shipped→delivered）
   - 例: ユーザー（inactive→active→suspended）

3. **クラス図は実装可能なレベルで記述**
   - 属性の型を明記
   - メソッドの引数・戻り値を明記
   - アクセス修飾子を記述（+public, -private, #protected）

4. **図とコードの対応を明確に**
   - 図中のクラス名・メソッド名は実装時の命名と一致させる
   - 変更があれば図も同時に更新する

---

## 概要

本文書は、G.U.Corp のソフトウェアプロジェクトにおけるドキュメント作成・管理の標準規約を定めます。
AIやレビュアーがドキュメントの品質を評価する際の基準として使用してください。

---

## 1. フォルダ構成

### 1.1 標準構成

\`\`\`text
docs/
├── 01-plan/              # Planning & Proposals / 企画・提案
├── 02-spec/              # Specifications / 仕様書
│   ├── 01-requirements/  # Requirements / 要件定義
│   ├── 02-design/        # Design / 設計
│   ├── 03-infrastructure/# Infrastructure / インフラ（オプション）
│   └── 04-testing/       # Test Specifications / テスト仕様
├── 03-guide/             # Guides & Manuals (SysOps) / ガイド・運用
├── 04-development/       # Development (DevOps) / 開発標準
├── 05-business/          # Business Strategy / ビジネス戦略（オプション）
├── 06-reference/         # Research & References / 参考資料（オプション）
└── README.md             # Documentation index / ドキュメント目次
\`\`\`

### 1.2 必須ファイル一覧

> **AI向け指示**: 以下のファイルは必ず作成してください。プロジェクトの性質上不要な場合のみスキップ可能です。

| パス | ファイル | 必須 | 説明 |
|------|----------|------|------|
| \`01-plan/\` | PROPOSAL.md | ✅ | プロジェクト提案書・企画書 |
| \`01-plan/\` | MVP.md | ○ | MVP定義（段階的リリースの場合） |
| \`01-plan/\` | ROADMAP.md | ○ | ロードマップ（複数バージョン計画時） |
| \`02-spec/01-requirements/\` | REQUIREMENTS.md | ✅ | 機能要件定義（FR-XXX形式） |
| \`02-spec/02-design/\` | ARCHITECTURE.md | ✅ | システム全体構成・技術選定 |
| \`02-spec/02-design/\` | CLASS.md | ✅ | クラス設計・ドメインモデル |
| \`02-spec/02-design/\` | ERROR-HANDLING.md | ✅ | エラー処理・例外設計 |
| \`02-spec/02-design/\` | API.md | △ | API仕様（APIがある場合） |
| \`02-spec/02-design/\` | DATABASE.md | △ | データベース設計（DBがある場合） |
| \`02-spec/02-design/\` | SCREEN.md | △ | 画面設計（UIがある場合） |
| \`02-spec/02-design/\` | UML.md | ✅ | UML図（シーケンス図、クラス図、状態遷移図）※実装精度向上に必須 |
| \`02-spec/03-infrastructure/\` | INFRASTRUCTURE.md | △ | インフラ構成（自社運用の場合） |
| \`02-spec/03-infrastructure/\` | DEPLOYMENT.md | △ | デプロイ仕様 |
| \`02-spec/03-infrastructure/\` | SECURITY.md | △ | セキュリティ仕様 |
| \`02-spec/04-testing/\` | TEST-CASES.md | ✅ | テストケース（TC-XXX形式） |
| \`02-spec/04-testing/\` | TEST.md | ○ | テスト戦略・方針 |
| \`02-spec/04-testing/\` | E2E.md | ○ | E2Eテストシナリオ |
| \`03-guide/\` | OPERATION-GUIDE.md | △ | 運用ガイド（本番運用時） |
| \`03-guide/\` | DEPLOYMENT-GUIDE.md | △ | デプロイ手順 |
| \`04-development/\` | SETUP.md | ✅ | 開発環境構築手順 |
| \`04-development/\` | CODING-STANDARDS.md | ○ | コーディング規約 |
| \`04-development/\` | TESTING.md | ○ | テスト実装ガイド |
| \`04-development/\` | GIT-WORKFLOW.md | ○ | Git運用ルール |
| \`04-development/\` | CI-CD.md | ○ | CI/CDパイプライン |

**凡例**: ✅=必須 / △=条件付き必須 / ○=推奨（あれば作成）

### 1.3 プロジェクトタイプ別ガイド

> **AI向け指示**: プロジェクトの種類を判断し、該当するファイルを作成してください。

#### Web アプリケーション（フロントエンド + バックエンド）

\`\`\`text
必須: ARCHITECTURE.md, CLASS.md, ERROR-HANDLING.md, UML.md, API.md, DATABASE.md, SCREEN.md
推奨: INFRASTRUCTURE.md, DEPLOYMENT.md
\`\`\`

#### バックエンドAPI / マイクロサービス

\`\`\`text
必須: ARCHITECTURE.md, CLASS.md, ERROR-HANDLING.md, UML.md, API.md, DATABASE.md
不要: SCREEN.md
推奨: INFRASTRUCTURE.md, SECURITY.md
\`\`\`

#### ライブラリ / SDK / パッケージ

\`\`\`text
必須: ARCHITECTURE.md, CLASS.md, ERROR-HANDLING.md, UML.md, API.md（公開API）
不要: DATABASE.md, SCREEN.md, INFRASTRUCTURE.md
\`\`\`

#### CLI ツール

\`\`\`text
必須: ARCHITECTURE.md, CLASS.md, ERROR-HANDLING.md, UML.md（コマンドフロー・状態遷移）
不要: API.md（REST API）, DATABASE.md, SCREEN.md
\`\`\`

#### インフラ / DevOps ツール

\`\`\`text
必須: ARCHITECTURE.md, ERROR-HANDLING.md, UML.md, INFRASTRUCTURE.md, DEPLOYMENT.md, SECURITY.md
不要: CLASS.md（簡易な場合）, SCREEN.md
\`\`\`

#### スマートコントラクト / ブロックチェーン

\`\`\`text
必須: ARCHITECTURE.md, CLASS.md, ERROR-HANDLING.md, UML.md（状態遷移図必須）, SECURITY.md
条件付き: API.md（フロントエンド連携時）, DATABASE.md（オフチェーンDB使用時）
\`\`\`

#### ドキュメントサイト / 静的サイト

\`\`\`text
必須: ARCHITECTURE.md（構成）
不要: CLASS.md, ERROR-HANDLING.md, UML.md, API.md, DATABASE.md
条件付き: INFRASTRUCTURE.md（自社ホスティング時）
\`\`\`

### 1.4 仕様書（02-spec）の詳細構成

\`\`\`text
02-spec/
├── 01-requirements/
│   ├── REQUIREMENTS.md          # 機能要件（FR-XXX形式必須）
│   └── {FEATURE}.md             # 機能別要件（大規模時）
├── 02-design/
│   ├── ARCHITECTURE.md          # システム全体構成
│   ├── CLASS.md                 # クラス設計・ドメインモデル
│   ├── ERROR-HANDLING.md        # エラー処理設計
│   ├── API.md                   # API仕様（REST/GraphQL/gRPC）
│   ├── DATABASE.md              # データベース設計・ER図
│   ├── SCREEN.md                # 画面設計・UIフロー
│   └── UML.md                   # UML図（シーケンス、状態遷移等）
├── 03-infrastructure/           # （オプション）
│   ├── INFRASTRUCTURE.md        # インフラ構成
│   ├── DEPLOYMENT.md            # デプロイ仕様
│   └── SECURITY.md              # セキュリティ仕様
└── 04-testing/
    ├── TEST-CASES.md            # テストケース（TC-XXX形式必須）
    ├── TEST.md                  # テスト戦略・方針
    └── E2E.md                   # E2Eテストシナリオ
\`\`\`

### 1.3 規模別ガイドライン

| 規模 | 基準 | 02-spec 構成 |
|------|------|--------------|
| 小規模 | 機能5個以下 | 02-design/ にフラット配置 |
| 中規模 | 機能6-15個 | 02-architecture/ + 03-detail-design/ 分離 |
| 大規模 | 機能16個以上 | 詳細設計を機能別フォルダで管理 |

### 1.4 ファイル分割ルール

| 基準 | 説明 |
|------|------|
| ✅ 機能/要件単位 | 1機能 = 1ファイル（または1フォルダ） |
| ✅ 独立性 | 単独で読んで理解できる単位 |
| ❌ 行数で機械的に分割 | 同じ機能が細切れになるのは避ける |

### 1.5 オプションフォルダ

| フォルダ | 用途 | ドキュメント例 |
|----------|------|----------------|
| 05-business/ | ビジネス戦略・事業計画 | GTM-STRATEGY.md, PARTNERSHIP.md, REVENUE-MODEL.md |
| 06-reference/ | リサーチ・分析・参考資料 | COMPETITIVE-ANALYSIS.md, MARKET-RESEARCH.md, BENCHMARK.md |

### 1.6 運用ドキュメントの配置

| ドキュメント | 配置先 | 理由 |
|-------------|--------|------|
| SLA定義 | 02-spec/04-infrastructure/ | 仕様として定義 |
| DR手順、インシデント対応 | 03-guide/ | 運用ガイド（SysOps） |
| CI/CD、デプロイ自動化 | 04-development/ | DevOps |

### 1.7 番号付け規則

- 第1レベルフォルダ: \`XX-name/\` 形式（例: \`01-plan/\`, \`02-spec/\`）
- 第2レベルフォルダ: \`XX-name/\` 形式（例: \`01-requirements/\`）
- 第3レベルフォルダ（機能別）: \`XX-name/\` 形式（例: \`01-auth/\`）
- 番号は連番で欠番なし（オプションフォルダ 05, 06 は使用時のみ）

### 1.8 要件とテストケースの規約（必須）

#### 1.8.1 要件ID

すべての機能要件には一意のIDを付与すること：

\`\`\`markdown
| ID | 要件 | 優先度 | 実装Ver |
|----|------|--------|---------|
| FR-001 | Google OAuth でログインできる | 高 | v1 |
| FR-002 | セッション管理ができる | 高 | v1 |
| FR-AUTH-001 | 二要素認証ができる | 中 | v2 |
| FR-EXT-001 | 外部SSO連携 | 低 | - |
\`\`\`

**実装Ver の値**:
- \`v1\`, \`v2\`, ... : 実装予定バージョン
- \`-\` : 未定・対象外

**形式**: \`FR-[カテゴリ-]*XXX\`（3桁の連番、カテゴリは任意の階層）

| 形式 | 例 | 用途 |
|------|-----|------|
| FR-XXX | FR-001, FR-002 | シンプルな連番 |
| FR-カテゴリ-XXX | FR-AUTH-001, FR-PAY-001 | 機能カテゴリ付き |
| FR-カテゴリ-サブ-XXX | FR-AUTH-LOGIN-001, FR-PAY-REFUND-001 | 階層カテゴリ |

#### 1.8.2 テストケースID

すべてのテストケースには一意のIDと対応する要件IDを付与すること：

\`\`\`markdown
| ID | 対象要件 | テスト内容 | 期待結果 |
|----|---------|-----------|---------|
| TC-U001 | FR-001 | 有効なGoogleアカウントでログイン | ダッシュボードに遷移 |
| TC-U002 | FR-001 | 無効なアカウントでログイン | エラーメッセージ表示 |
| TC-I001 | FR-002 | セッションタイムアウト | ログイン画面に遷移 |
| TC-E001 | FR-001,FR-002 | ログイン〜ログアウトのシナリオ | 正常完了 |
\`\`\`

**形式**: \`TC-XNNN\`（カテゴリ1文字 + 3桁の連番）

| プレフィックス | カテゴリ | 説明 |
|---------------|---------|------|
| TC-U | Unit | 単体テスト（関数・クラス単位） |
| TC-I | Integration | 結合テスト（API・DB連携） |
| TC-E | E2E | エンドツーエンド（ユーザーシナリオ） |
| TC-P | Performance | 性能テスト |
| TC-S | Security | セキュリティテスト |
| TC-D | Deferred | 延期（将来バージョンで実装予定） |
| TC-X | Excluded | 対象外（スコープ外、または実装しない） |

#### 1.8.2.1 延期・対象外の記録

現バージョンで実装しない要件は、理由を明記してテストケースとして記録：

\`\`\`markdown
| ID | 対象要件 | ステータス | 理由 |
|----|---------|-----------|------|
| TC-D001 | FR-AUTH-002 | v2で実装 | 二要素認証はv2ロードマップ |
| TC-D002 | FR-PAY-003 | v2で実装 | 暗号通貨決済は優先度低 |
| TC-X001 | FR-EXT-001 | 対象外 | 外部連携は別プロジェクトで対応 |
\`\`\`

**注意**: TC-D/TC-X も100%カバレッジに含まれます（要件の追跡漏れを防ぐため）

#### 1.8.3 テストファイル構成

\`\`\`
05-testing/
├── TEST-PLAN.md           # テスト計画・方針
├── UNIT-TESTS.md          # TC-U001, TC-U002...
├── INTEGRATION-TESTS.md   # TC-I001, TC-I002...
├── E2E-TESTS.md           # TC-E001, TC-E002...
└── DEFERRED-TESTS.md      # TC-D001, TC-X001... (延期・対象外)
\`\`\`

#### 1.8.4 カバレッジ要件

| 要件 | 必須レベル |
|------|-----------|
| 全機能要件に要件ID（FR-XXX）を付与 | **必須** |
| 全テストケースにID（TC-XXX）を付与 | **必須** |
| 全要件のテストケースカバレッジ | **100%必須** |

**注意**: テストケースが機能要件を100%カバーしていない場合、lintエラーとなります。

---

## 2. ファイル命名規則

### 2.1 基本規則

- ファイル名: \`UPPER-CASE.md\` 形式（例: \`REQUIREMENTS.md\`, \`API.md\`）
- README: 各フォルダに必須（小文字でも可）
- 禁止: 日付や番号のプレフィックス（旧形式: \`00-PROPOSAL.md\`）

### 2.2 必須ファイル

| パス | 説明 |
|------|------|
| \`README.md\` | ドキュメント目次・概要 |
| \`01-plan/PROPOSAL.md\` | プロジェクト提案書 |
| \`02-spec/01-requirements/REQUIREMENTS.md\` | 要件定義書 |

---

## 3. ドキュメント構造

### 3.1 必須セクション

すべての仕様書には以下のセクションを含める：

\`\`\`markdown
# ドキュメントタイトル

**バージョン**: X.X
**更新日**: YYYY-MM-DD

---

## 概要
（ドキュメントの目的と範囲）

## 内容
（本文）

---

## 関連ドキュメント

- [要件定義書](../01-requirements/REQUIREMENTS.md)
- [設計書](../02-design/ARCHITECTURE.md)
\`\`\`

### 3.2 バージョン情報

- 形式: \`**バージョン**: X.X\` または \`**Version**: X.X\`
- 位置: ドキュメント冒頭（タイトル直後）

### 3.3 関連ドキュメント

- 形式: 「関連ドキュメント」または「Related Documents」セクション
- 位置: ドキュメント末尾
- 内容: 相対パスによるリンク

---

## 4. マークダウン規約

### 4.1 見出し

- H1（\`#\`）: ドキュメントタイトル（1つのみ）
- H2以降: 階層を飛ばさない（H1→H2→H3）

### 4.2 コードブロック

- 必ず言語を指定する

\`\`\`typescript
// 良い例
const example = "value";
\`\`\`

- 禁止: 言語指定なしのコードブロック

### 4.3 TODO/FIXME

- 本番ドキュメントには残さない
- 未完成の場合は「[未定]」「TBD」を使用

---

## 5. 品質基準

### 5.1 評価項目

| 項目 | 基準 |
|------|------|
| 構造的完全性 | 必須セクションがすべて存在 |
| 参照整合性 | リンク切れなし、相互参照が適切 |
| 用語統一 | プロジェクト内で用語が統一 |
| 完成度 | TODO/FIXME なし、プレースホルダなし |

### 5.2 重要度

- **エラー（修正必須）**: リンク切れ、レガシーファイル参照
- **警告（改善推奨）**: バージョン情報なし、関連ドキュメントなし、言語指定なしのコードブロック

---

## 6. 用語集

| 用語 | 表記 | 禁止表記 |
|------|------|----------|
| ドキュメント | ドキュメント | 文書、ドキュメンテーション |
| ユーザー | ユーザー | user、利用者 |
| API | API | api、Api |
| テナント | テナント | tenant |
| KMSキー | KMSキー | KMS key、鍵 |

---

## 7. 多言語化規約

### 7.1 基本方針

**「共通語」と「ドラフト（作業）語」を分離する**

- **共通語**: チーム横断で共有するドキュメントの言語（通常は英語）
- **ドラフト語**: 各チームが作業時に使用する言語（チームの母語）

### 7.2 フォルダ構成

\`\`\`text
docs/
├── README.md                 # 共通語（英語）= Single Source of Truth
├── 01-plan/
│   └── PROPOSAL.md           # 共通語
├── 02-spec/
│   └── ...
├── drafts/                   # ドラフト（作業用）
│   ├── ja/                   # 日本チーム
│   │   └── PROPOSAL.md       # 日本語で詳細を書く
│   └── vi/                   # ベトナムチーム
│       └── PROPOSAL.md       # ベトナム語で書く
└── internal/                 # チーム内部資料（各自の言語OK）
\`\`\`

**ポイント**
- \`docs/\` 直下 = 共通語（正式版）
- \`docs/drafts/{lang}/\` = 作業用ドラフト
- ドラフト → 共通語への翻訳はレビュー後に実施

### 7.3 言語選択ルール

| 対象 | 言語 | 理由 |
|------|------|------|
| チーム横断ドキュメント | 共通語（英語） | 全員がアクセス可能 |
| API/IF仕様 | 共通語（英語） | 開発者全員が参照 |
| チーム内ドラフト | 各チームの言語 | 品質・効率優先 |
| コード/コメント | 英語 | コード=共有資産 |
| PR/レビュー | 英語 | 非同期コミュニケーション |

### 7.4 設定ファイル

**docs.config.json**
\`\`\`json
{
  "commonLanguage": "en",
  "draftLanguages": ["ja", "vi", "en"],
  "teams": {
    "tokyo": "ja",
    "hanoi": "vi",
    "global": "en"
  }
}
\`\`\`

### 7.5 翻訳ルール

| 規則 | 説明 |
|------|------|
| ドラフト優先 | ドラフト言語で品質高く書き、共通語に翻訳 |
| 同期更新 | ドラフト更新時は共通語版も更新 |
| 未翻訳表記 | 翻訳が追いついていない場合は「[Translation pending]」を記載 |
| 技術用語 | 原則英語のまま使用（API, KMS, OAuth等） |
| 固有名詞 | 製品名・会社名は原語のまま |

### 7.6 翻訳品質基準

- 機械翻訳のみは禁止（レビュー必須）
- 専門用語の一貫性を維持（用語集を参照）
- 文化的な表現の適切な置き換え

### 7.7 本プロジェクトの設定

<!-- TODO: プロジェクトに合わせて設定してください -->
| 項目 | 値 |
|------|-----|
| 共通語 | [要設定: en / ja / etc.] |
| ドラフト言語 | [要設定] |
| コード内コメント | 英語推奨 |

---

## 8. レビューチェックリスト

ドキュメント作成時・レビュー時に確認：

- [ ] タイトルと目的が明確
- [ ] バージョン情報が記載
- [ ] 関連ドキュメントセクションあり
- [ ] すべてのリンクが有効
- [ ] コードブロックに言語指定あり
- [ ] TODO/FIXME が残っていない
- [ ] 用語が統一されている
- [ ] 見出しの階層が正しい
- [ ] 多言語対応が必要な場合、翻訳版が同期されている

---

## 関連ドキュメント

- [README](./README.md) - ドキュメント目次
`;

/**
 * Get the default standards content
 */
export function getDefaultStandards(): string {
  return DEFAULT_STANDARDS_TEMPLATE;
}
