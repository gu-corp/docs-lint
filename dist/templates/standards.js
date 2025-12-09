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
├── 01-plan/              # Planning & Future Vision / 計画・構想・将来仕様
├── 02-spec/              # Current Specifications / 現在の仕様（実装対象）
│   ├── 01-requirements/  # Requirements / 要件定義
│   ├── 02-design/        # Design / 設計
│   ├── 03-infrastructure/# Infrastructure / インフラ（オプション）
│   └── 04-testing/       # Test Specifications / テスト仕様
├── 03-guide/             # Guides & Manuals (SysOps) / ガイド・運用
├── 04-development/       # Development (DevOps) / 開発標準
├── 05-business/          # Other Business Materials / その他ビジネス関連（オプション）
├── 06-reference/         # Research & References / 参考資料（オプション）
└── README.md             # Documentation index / ドキュメント目次
\`\`\`

### 1.1.1 01-plan と 02-spec の役割分担

> **AI向け指示**: この分離を厳密に守ってください。実装時は02-specのみを参照します。

| フォルダ | 役割 | 実装対象 |
|---------|------|---------|
| \`01-plan/\` | 計画・構想・将来仕様 | ❌ 実装しない |
| \`02-spec/\` | 現在の仕様 | ✅ 実装する |

#### 01-plan に含めるもの

- **ビジョン・目的**: なぜこのプロジェクトを作るのか
- **ビジネスプラン**: 収益モデル、市場分析、競合調査
- **ロードマップ**: バージョン別の計画
- **将来仕様**: 次バージョン以降で実装予定の要件・設計

#### 02-spec に含めるもの

- **現バージョンの要件**: 今実装すべき機能要件（FR-XXX）
- **現バージョンの設計**: 今実装すべきアーキテクチャ、クラス設計
- **テスト仕様**: 現バージョンのテストケース

#### バージョンアップ時の移動

\`\`\`text
v1リリース後、v2開発開始時:
  01-plan/v2/REQUIREMENTS.md → 02-spec/01-requirements/REQUIREMENTS.md に統合
  01-plan/v2/DESIGN.md → 02-spec/02-design/ に統合
\`\`\`

### 1.2 必須ファイル一覧

> **AI向け指示**: 以下のファイルは必ず作成してください。プロジェクトの性質上不要な場合のみスキップ可能です。

| パス | ファイル | 必須 | 説明 |
|------|----------|------|------|
| \`01-plan/\` | PROPOSAL.md | ✅ | プロジェクト提案書・ビジョン |
| \`01-plan/\` | BUSINESS-PLAN.md | ○ | ビジネスプラン・収益モデル |
| \`01-plan/\` | MARKET-ANALYSIS.md | ○ | 市場分析・競合調査 |
| \`01-plan/\` | ROADMAP.md | ○ | バージョン別ロードマップ |
| \`01-plan/\` | MVP.md | ○ | MVP定義（段階的リリースの場合） |
| \`01-plan/v{N}/\` | REQUIREMENTS.md | ○ | 将来バージョンの要件（v2, v3...） |
| \`01-plan/v{N}/\` | DESIGN.md | ○ | 将来バージョンの設計概要 |
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
│   ├── SCREEN.md                # 画面設計・UIフロー（概要）
│   ├── UML.md                   # UML図（シーケンス、状態遷移等）
│   └── screens/                 # 画面詳細設計（複雑な場合）
│       ├── 01-login/
│       │   └── LOGIN.md
│       ├── 02-dashboard/
│       │   └── DASHBOARD.md
│       └── 03-settings/
│           └── SETTINGS.md
├── 03-infrastructure/           # （オプション）
│   ├── INFRASTRUCTURE.md        # インフラ構成
│   ├── DEPLOYMENT.md            # デプロイ仕様
│   └── SECURITY.md              # セキュリティ仕様
└── 04-testing/
    ├── TEST-CASES.md            # テストケース総括（TC-XXX形式必須）
    ├── UNIT-TESTS.md            # 単体テスト仕様
    ├── INTEGRATION-TESTS.md     # 結合テスト仕様
    ├── E2E-TESTS.md             # E2Eテスト仕様
    ├── SCENARIO-TESTS.md        # ユーザーシナリオテスト
    └── scenarios/               # シナリオ詳細（複雑な場合）
        ├── 01-onboarding/
        └── 02-checkout/
\`\`\`

### 1.5 詳細設計のフォルダ分割ルール

> **AI向け指示**: 設計が複雑な場合は、必ずフォルダを分割して管理してください。

#### 分割の判断基準

| 条件 | 対応 |
|------|------|
| 画面数が10以上 | \`02-design/screens/\` にフォルダ分割 |
| API エンドポイントが20以上 | \`02-design/api/\` にドメイン別分割 |
| 1ファイルが500行を超える | 機能別にフォルダ分割 |
| 複数チームが並行開発 | 担当領域ごとにフォルダ分割 |

#### 画面詳細設計の分割例

\`\`\`text
02-design/screens/
├── 01-auth/                     # 認証関連画面
│   ├── LOGIN.md                 # ログイン画面
│   ├── REGISTER.md              # 新規登録画面
│   ├── PASSWORD-RESET.md        # パスワードリセット
│   └── MFA.md                   # 多要素認証
├── 02-dashboard/                # ダッシュボード
│   ├── OVERVIEW.md              # 概要画面
│   ├── ANALYTICS.md             # 分析画面
│   └── WIDGETS.md               # ウィジェット仕様
├── 03-user/                     # ユーザー管理
│   ├── PROFILE.md               # プロフィール
│   └── SETTINGS.md              # 設定画面
└── 04-admin/                    # 管理者画面
    ├── USER-MANAGEMENT.md       # ユーザー管理
    └── SYSTEM-SETTINGS.md       # システム設定
\`\`\`

#### 各画面詳細設計ファイルの必須項目

\`\`\`markdown
# {画面名} 画面詳細設計

**対応要件**: FR-XXX, FR-YYY
**画面ID**: SCR-001

---

## 画面概要
（画面の目的、アクセス条件）

## 画面レイアウト
（Mermaid/ASCII/Figma リンク）

## UI コンポーネント
| ID | コンポーネント | 種類 | バリデーション |
|----|--------------|------|--------------|
| C001 | メールアドレス入力 | TextField | 必須、Email形式 |

## 画面遷移
\`\`\`mermaid
stateDiagram-v2
    [*] --> 入力中
    入力中 --> 確認中: 送信
    確認中 --> 完了: 確認OK
    確認中 --> 入力中: 戻る
\`\`\`

## API連携
| アクション | API | メソッド |
|-----------|-----|---------|
| ログイン | /api/auth/login | POST |

## エラー処理
| エラーコード | 表示メッセージ | 対応 |
|-------------|--------------|------|
| AUTH001 | メールアドレスが無効です | 入力欄をハイライト |

---

## 関連ドキュメント
- [API仕様](../API.md)
- [エラー処理](../ERROR-HANDLING.md)
\`\`\`

### 1.6 規模別ガイドライン

| 規模 | 基準 | 02-spec 構成 |
|------|------|--------------|
| 小規模 | 機能5個以下 | 02-design/ にフラット配置 |
| 中規模 | 機能6-15個 | 02-architecture/ + 03-detail-design/ 分離 |
| 大規模 | 機能16個以上 | 詳細設計を機能別フォルダで管理 |

### 1.7 ファイル分割ルール

| 基準 | 説明 |
|------|------|
| ✅ 機能/要件単位 | 1機能 = 1ファイル（または1フォルダ） |
| ✅ 独立性 | 単独で読んで理解できる単位 |
| ❌ 行数で機械的に分割 | 同じ機能が細切れになるのは避ける |

### 1.8 01-plan の詳細構成

> **AI向け指示**: 01-planはビジネス計画と将来仕様を含みます。実装時は参照しないでください。

\`\`\`text
01-plan/
├── PROPOSAL.md              # プロジェクト提案・ビジョン [必須]
├── BUSINESS-PLAN.md         # ビジネスプラン・収益モデル
├── MARKET-ANALYSIS.md       # 市場分析・競合調査
├── ROADMAP.md               # バージョン別ロードマップ
├── MVP.md                   # MVP定義
├── v2/                      # v2で実装予定の仕様
│   ├── REQUIREMENTS.md      # v2の要件
│   ├── DESIGN.md            # v2の設計概要
│   └── MIGRATION.md         # v1→v2移行計画
├── v3/                      # v3で実装予定の仕様
│   └── ...
└── backlog/                 # 優先度未定・検討中のアイデア
    └── IDEAS.md
\`\`\`

#### PROPOSAL.md の必須項目

\`\`\`markdown
# プロジェクト名

**バージョン**: 1.0
**更新日**: YYYY-MM-DD

---

## ビジョン
（このプロジェクトが目指す世界）

## 解決する課題
（ユーザーが抱える問題）

## ターゲットユーザー
（誰のために作るのか）

## 主要機能
（コア機能の概要）

## 成功指標（KPI）
（何をもって成功とするか）

## スコープ
### In Scope（対象）
### Out of Scope（対象外）

---

## 関連ドキュメント
- [ロードマップ](./ROADMAP.md)
- [現在の要件](../02-spec/01-requirements/REQUIREMENTS.md)
\`\`\`

#### BUSINESS-PLAN.md の項目

| セクション | 内容 |
|-----------|------|
| 収益モデル | どのように収益を得るか（SaaS、ライセンス、広告等） |
| 価格戦略 | 価格設定、プラン構成 |
| ターゲット市場 | TAM/SAM/SOM |
| 競合優位性 | 差別化ポイント |
| Go-to-Market | 市場投入戦略 |

#### ROADMAP.md の項目

\`\`\`markdown
# ロードマップ

## 現在のバージョン: v1.0

## v1.0（現在開発中）
- [ ] FR-001: ユーザー認証
- [ ] FR-002: ダッシュボード
- 詳細: [02-spec/01-requirements/REQUIREMENTS.md](../02-spec/01-requirements/REQUIREMENTS.md)

## v2.0（計画中）
- [ ] FR-AUTH-001: 二要素認証
- [ ] FR-PAY-001: 決済機能
- 詳細: [01-plan/v2/REQUIREMENTS.md](./v2/REQUIREMENTS.md)

## v3.0（構想）
- [ ] FR-EXT-001: 外部連携
- 詳細: [01-plan/backlog/IDEAS.md](./backlog/IDEAS.md)
\`\`\`

### 1.9 オプションフォルダ

| フォルダ | 用途 | ドキュメント例 |
|----------|------|----------------|
| 05-business/ | その他ビジネス関連資料 | CONTRACTS/, PARTNERSHIPS.md, SALES-MATERIALS/ |
| 06-reference/ | リサーチ・参考資料 | COMPETITIVE-ANALYSIS.md, BENCHMARK.md |

**注意**: ビジネスプラン本体は \`01-plan/\` に配置。\`05-business/\` は契約書テンプレート、パートナー資料、営業資料など補助的な資料用。

### 1.10 運用ドキュメントの配置

| ドキュメント | 配置先 | 理由 |
|-------------|--------|------|
| SLA定義 | 02-spec/04-infrastructure/ | 仕様として定義 |
| DR手順、インシデント対応 | 03-guide/ | 運用ガイド（SysOps） |
| CI/CD、デプロイ自動化 | 04-development/ | DevOps |

### 1.11 番号付け規則

- 第1レベルフォルダ: \`XX-name/\` 形式（例: \`01-plan/\`, \`02-spec/\`）
- 第2レベルフォルダ: \`XX-name/\` 形式（例: \`01-requirements/\`）
- 第3レベルフォルダ（機能別）: \`XX-name/\` 形式（例: \`01-auth/\`）
- 番号は連番で欠番なし（オプションフォルダ 05, 06 は使用時のみ）

### 1.12 要件とテストケースの規約（必須）

#### 1.12.1 要件ID

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

#### 1.12.2 テストケースID

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

#### 1.12.2.1 延期・対象外の記録

現バージョンで実装しない要件は、理由を明記してテストケースとして記録：

\`\`\`markdown
| ID | 対象要件 | ステータス | 理由 |
|----|---------|-----------|------|
| TC-D001 | FR-AUTH-002 | v2で実装 | 二要素認証はv2ロードマップ |
| TC-D002 | FR-PAY-003 | v2で実装 | 暗号通貨決済は優先度低 |
| TC-X001 | FR-EXT-001 | 対象外 | 外部連携は別プロジェクトで対応 |
\`\`\`

**注意**: TC-D/TC-X も100%カバレッジに含まれます（要件の追跡漏れを防ぐため）

#### 1.12.3 テストファイル構成

\`\`\`text
04-testing/
├── TEST-CASES.md            # テストケース総括・トレーサビリティマトリクス
├── UNIT-TESTS.md            # 単体テスト仕様（TC-U001...）
├── INTEGRATION-TESTS.md     # 結合テスト仕様（TC-I001...）
├── E2E-TESTS.md             # E2Eテスト仕様（TC-E001...）
├── SCENARIO-TESTS.md        # ユーザーシナリオテスト（TC-SC001...）
├── DEFERRED-TESTS.md        # 延期・対象外（TC-D001, TC-X001...）
└── scenarios/               # 複雑なシナリオの詳細
    ├── 01-user-onboarding/
    │   └── ONBOARDING.md
    └── 02-purchase-flow/
        └── CHECKOUT.md
\`\`\`

#### 1.12.4 カバレッジ要件

| 要件 | 必須レベル |
|------|-----------|
| 全機能要件に要件ID（FR-XXX）を付与 | **必須** |
| 全テストケースにID（TC-XXX）を付与 | **必須** |
| 全要件のテストケースカバレッジ | **100%必須** |

**注意**: テストケースが機能要件を100%カバーしていない場合、lintエラーとなります。

---

## 2. テスト仕様の詳細規約

> **AI向け指示**: テスト仕様は実装者が迷わず書けるレベルで詳細に記述してください。

### 2.1 テストレベルと責務

| レベル | 責務 | ツール | カバレッジ目標 |
|--------|------|-------|--------------|
| Unit（単体） | 関数・クラス単位の動作検証 | **Vitest** | 80%以上 |
| Integration（結合） | API・DB・外部サービス連携 | **Vitest** + Supertest | 主要パス100% |
| Component（コンポーネント） | UIコンポーネント単体 | **Vitest** + Testing Library | 全コンポーネント |
| E2E（エンドツーエンド） | ユーザー操作フロー | **Playwright** | クリティカルパス100% |
| Scenario（シナリオ） | 業務シナリオ全体 | **Playwright** | 主要ユースケース |

### 2.2 単体テスト仕様（UNIT-TESTS.md）

> **AI向け指示**: 全ての公開関数・メソッドに対してテストケースを設計してください。

#### 必須テンプレート

\`\`\`markdown
# 単体テスト仕様

**対象**: src/services/*.ts, src/utils/*.ts
**ツール**: Vitest
**カバレッジ目標**: 80%以上

---

## テストケース

### UserService

| ID | メソッド | テスト内容 | 入力 | 期待結果 |
|----|---------|----------|------|---------|
| TC-U001 | createUser | 正常系：有効なデータ | {name: "Test", email: "test@example.com"} | User オブジェクト返却 |
| TC-U002 | createUser | 異常系：email重複 | {name: "Test", email: "existing@example.com"} | DuplicateEmailError |
| TC-U003 | createUser | 境界値：name最大長 | {name: "A".repeat(255)} | 正常終了 |
| TC-U004 | createUser | 境界値：name超過 | {name: "A".repeat(256)} | ValidationError |

### 実装ファイル配置

\\\`\\\`\\\`text
src/
├── services/
│   ├── UserService.ts
│   └── __tests__/
│       └── UserService.test.ts    # TC-U001〜TC-U004
\\\`\\\`\\\`
\`\`\`

#### 単体テスト設計のルール

1. **テストケース設計技法を必ず適用**
   - 同値分割（有効・無効クラス）
   - 境界値分析（最小、最大、境界±1）
   - デシジョンテーブル（条件の組み合わせ）

2. **異常系を必ず網羅**
   - null/undefined 入力
   - 空文字・空配列
   - 型エラー
   - 権限エラー

3. **モック戦略**
   - 外部API → モック必須
   - データベース → インメモリDB or モック
   - 時刻依存 → vi.useFakeTimers()

### 2.3 結合テスト仕様（INTEGRATION-TESTS.md）

> **AI向け指示**: API エンドポイントとデータベース操作を中心にテストを設計してください。

#### 必須テンプレート

\`\`\`markdown
# 結合テスト仕様

**対象**: API エンドポイント、DB 操作
**ツール**: Vitest + Supertest + テストDB
**環境**: Docker Compose でテスト用DB起動

---

## テストケース

### POST /api/users

| ID | シナリオ | 前提条件 | リクエスト | 期待レスポンス |
|----|---------|---------|-----------|--------------|
| TC-I001 | ユーザー作成成功 | DBが空 | {name, email, password} | 201 Created |
| TC-I002 | メール重複エラー | 同一メールが存在 | {name, email, password} | 409 Conflict |
| TC-I003 | 認証エラー | トークンなし | {name, email} | 401 Unauthorized |

### データベーステスト

| ID | 対象 | テスト内容 | 期待結果 |
|----|------|----------|---------|
| TC-I010 | users テーブル | 作成→取得→更新→削除 | 全操作成功 |
| TC-I011 | トランザクション | 途中エラーでロールバック | データ不整合なし |
\`\`\`

### 2.4 E2Eテスト仕様（E2E-TESTS.md）

> **AI向け指示**: Playwright を使用し、実際のブラウザ操作をテストしてください。

#### 必須テンプレート

\`\`\`markdown
# E2Eテスト仕様

**ツール**: Playwright
**ブラウザ**: Chromium, Firefox, WebKit
**環境**: ステージング環境

---

## テストケース

### ログインフロー

| ID | シナリオ | 操作手順 | 期待結果 |
|----|---------|---------|---------|
| TC-E001 | 正常ログイン | 1. /login にアクセス<br>2. メール入力<br>3. パスワード入力<br>4. ログインボタン押下 | ダッシュボードに遷移 |
| TC-E002 | ログイン失敗 | 1. /login にアクセス<br>2. 不正なパスワード入力<br>3. ログインボタン押下 | エラーメッセージ表示 |

### 実装例

\\\`\\\`\\\`typescript
// e2e/auth/login.spec.ts
import { test, expect } from '@playwright/test';

test('TC-E001: 正常ログイン', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'user@example.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="login-button"]');
  await expect(page).toHaveURL('/dashboard');
});
\\\`\\\`\\\`
\`\`\`

#### E2Eテスト設計のルール

1. **data-testid 属性を必須化**
   - 全ての操作対象要素に \`data-testid\` を付与
   - 命名規則: \`{component}-{action}\`（例: \`login-button\`）

2. **ページオブジェクトパターン推奨**
   - 画面ごとにページクラスを作成
   - セレクタの重複を排除

3. **テストデータ管理**
   - テスト専用のシードデータを用意
   - テスト後のクリーンアップ必須

### 2.5 ユーザーシナリオテスト（SCENARIO-TESTS.md）

> **AI向け指示**: 実際のユーザーが行う一連の業務フローを網羅してください。

#### 必須テンプレート

\`\`\`markdown
# ユーザーシナリオテスト仕様

**目的**: 実際のユーザー行動に基づく業務フローの検証
**ツール**: Playwright
**観点**: ユーザビリティ、業務完遂性

---

## シナリオ一覧

| ID | シナリオ名 | アクター | 対応要件 | 優先度 |
|----|-----------|---------|---------|-------|
| TC-SC001 | 新規ユーザーオンボーディング | 新規ユーザー | FR-001〜FR-005 | 高 |
| TC-SC002 | 商品購入フロー | 購入者 | FR-010〜FR-020 | 高 |
| TC-SC003 | 管理者によるユーザー管理 | 管理者 | FR-ADMIN-001〜005 | 中 |

---

## TC-SC001: 新規ユーザーオンボーディング

### シナリオ概要
新規ユーザーがサービスに登録し、初期設定を完了するまでの一連のフロー

### 前提条件
- ユーザーは未登録状態
- メールアドレスは有効

### 手順

| ステップ | 操作 | 期待結果 | 備考 |
|---------|------|---------|------|
| 1 | トップページにアクセス | ランディングページ表示 | |
| 2 | 「新規登録」ボタン押下 | 登録フォーム表示 | |
| 3 | メール・パスワード入力 | バリデーション通過 | パスワード強度表示 |
| 4 | 「登録」ボタン押下 | 確認メール送信 | |
| 5 | メール内リンクをクリック | メール認証完了 | |
| 6 | プロフィール設定 | 設定保存成功 | |
| 7 | チュートリアル完了 | ダッシュボード表示 | |

### 代替フロー

| 分岐点 | 条件 | 代替手順 |
|-------|------|---------|
| ステップ3 | パスワードが弱い | エラー表示、再入力促進 |
| ステップ4 | メール送信失敗 | リトライ案内表示 |
| ステップ5 | リンク期限切れ | 再送信リンク表示 |

### 検証ポイント

- [ ] 全ステップが3分以内に完了可能
- [ ] エラー時のリカバリーが明確
- [ ] 離脱ポイントでの適切なガイダンス
\`\`\`

### 2.6 テストフォルダ構成（実装側）

> **AI向け指示**: テストコードは以下の構成で配置してください。

\`\`\`text
project/
├── src/
│   ├── services/
│   │   └── __tests__/           # 単体テスト（コロケーション）
│   └── components/
│       └── __tests__/           # コンポーネントテスト
├── tests/
│   ├── integration/             # 結合テスト
│   │   ├── api/
│   │   └── db/
│   └── e2e/                     # E2E・シナリオテスト
│       ├── auth/
│       ├── dashboard/
│       └── scenarios/
├── vitest.config.ts             # Vitest 設定
└── playwright.config.ts         # Playwright 設定
\`\`\`

### 2.7 テストツール設定

#### Vitest 推奨設定

\`\`\`typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',           // or 'jsdom' for React
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['**/*.test.ts', '**/tests/**'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
  },
});
\`\`\`

#### Playwright 推奨設定

\`\`\`typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
\`\`\`

### 2.8 テスト品質チェックリスト

> **AI向け指示**: テスト仕様作成時に以下を必ず確認してください。

#### 網羅性

- [ ] 全ての FR-XXX に対応する TC-XXX が存在する
- [ ] 正常系・異常系の両方がカバーされている
- [ ] 境界値テストが含まれている
- [ ] 権限別のテストが含まれている（ある場合）

#### 実行可能性

- [ ] テストデータが明確に定義されている
- [ ] 前提条件が明記されている
- [ ] 期待結果が具体的である
- [ ] 再現可能な手順になっている

#### 保守性

- [ ] テストIDが一意で追跡可能
- [ ] テストの独立性が保たれている（順序依存なし）
- [ ] セットアップ・クリーンアップが明確

### 2.9 追加のベストプラクティス

> **AI向け指示**: 以下のプラクティスを積極的に適用してください。

#### テストピラミッドの遵守

\`\`\`text
        /\\
       /  \\  E2E（少数・重要フローのみ）
      /----\\
     /      \\  Integration（API境界）
    /--------\\
   /          \\  Unit（多数・高速）
  --------------
\`\`\`

| レベル | 割合目安 | 特徴 |
|--------|---------|------|
| Unit | 70% | 高速、独立、モック多用 |
| Integration | 20% | API/DB境界、実環境に近い |
| E2E | 10% | 遅い、脆い、クリティカルパスのみ |

#### スナップショットテストの活用

UIコンポーネントの意図しない変更を検出：

\`\`\`typescript
// コンポーネントテスト
import { render } from '@testing-library/react';

test('Button コンポーネントのスナップショット', () => {
  const { container } = render(<Button>Click me</Button>);
  expect(container).toMatchSnapshot();
});
\`\`\`

#### テストダブルの使い分け

| 種類 | 用途 | 例 |
|------|------|-----|
| **Stub** | 固定値を返す | API レスポンスの固定 |
| **Mock** | 呼び出しを検証 | 関数が呼ばれたか確認 |
| **Spy** | 実装を保持しつつ監視 | 実際の処理 + 呼び出し検証 |
| **Fake** | 簡易実装 | インメモリDB |

#### 非同期テストのパターン

\`\`\`typescript
// ❌ 悪い例：タイムアウト依存
await new Promise(resolve => setTimeout(resolve, 1000));

// ✅ 良い例：条件待機
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});

// ✅ 良い例：Playwright の自動待機
await expect(page.getByText('Loaded')).toBeVisible();
\`\`\`

#### フレイキーテスト（不安定テスト）の防止

| 原因 | 対策 |
|------|------|
| タイミング依存 | 明示的な待機条件を使用 |
| 順序依存 | テストごとにデータをリセット |
| 環境依存 | Docker で環境を固定 |
| 乱数依存 | シードを固定 |

#### アクセシビリティテストの組み込み

\`\`\`typescript
// axe-core を使用
import { axe, toHaveNoViolations } from 'jest-axe';

test('アクセシビリティ違反がないこと', async () => {
  const { container } = render(<LoginForm />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
\`\`\`

#### パフォーマンステストの基準

| 指標 | 目標値 | 測定方法 |
|------|--------|---------|
| API レスポンス | < 200ms（p95） | k6, Artillery |
| ページロード | < 3s（LCP） | Lighthouse CI |
| バンドルサイズ | < 200KB（gzip） | webpack-bundle-analyzer |

#### CI/CD でのテスト実行

\`\`\`yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:unit -- --coverage
      - run: npm run test:integration
      - name: E2E Tests
        run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
\`\`\`

---

## 3. ファイル命名規則

### 3.1 基本規則

- ファイル名: \`UPPER-CASE.md\` 形式（例: \`REQUIREMENTS.md\`, \`API.md\`）
- README: 各フォルダに必須（小文字でも可）
- 禁止: 日付や番号のプレフィックス（旧形式: \`00-PROPOSAL.md\`）

### 3.2 必須ファイル

| パス | 説明 |
|------|------|
| \`README.md\` | ドキュメント目次・概要 |
| \`01-plan/PROPOSAL.md\` | プロジェクト提案書 |
| \`02-spec/01-requirements/REQUIREMENTS.md\` | 要件定義書 |

---

## 4. ドキュメント構造

### 4.1 必須セクション

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

### 4.2 バージョン情報

- 形式: \`**バージョン**: X.X\` または \`**Version**: X.X\`
- 位置: ドキュメント冒頭（タイトル直後）

### 4.3 関連ドキュメント

- 形式: 「関連ドキュメント」または「Related Documents」セクション
- 位置: ドキュメント末尾
- 内容: 相対パスによるリンク

---

## 5. マークダウン規約

### 5.1 見出し

- H1（\`#\`）: ドキュメントタイトル（1つのみ）
- H2以降: 階層を飛ばさない（H1→H2→H3）

### 5.2 コードブロック

- 必ず言語を指定する

\`\`\`typescript
// 良い例
const example = "value";
\`\`\`

- 禁止: 言語指定なしのコードブロック

### 5.3 TODO/FIXME

- 本番ドキュメントには残さない
- 未完成の場合は「[未定]」「TBD」を使用

---

## 6. 品質基準

### 6.1 評価項目

| 項目 | 基準 |
|------|------|
| 構造的完全性 | 必須セクションがすべて存在 |
| 参照整合性 | リンク切れなし、相互参照が適切 |
| 用語統一 | プロジェクト内で用語が統一 |
| 完成度 | TODO/FIXME なし、プレースホルダなし |

### 6.2 重要度

- **エラー（修正必須）**: リンク切れ、レガシーファイル参照
- **警告（改善推奨）**: バージョン情報なし、関連ドキュメントなし、言語指定なしのコードブロック

---

## 7. 用語集

| 用語 | 表記 | 禁止表記 |
|------|------|----------|
| ドキュメント | ドキュメント | 文書、ドキュメンテーション |
| ユーザー | ユーザー | user、利用者 |
| API | API | api、Api |
| テナント | テナント | tenant |
| KMSキー | KMSキー | KMS key、鍵 |

---

## 8. 多言語化規約

### 8.1 基本方針

**「ソース言語」と「翻訳版」を分離する**

- **ソース言語**: ドキュメントの原本となる言語（プロジェクトごとに設定）
- **翻訳版**: ソース言語から翻訳されたドキュメント

### 8.2 フォルダ構成

\`\`\`text
docs/
├── README.md                 # ソース言語（原本）
├── 01-plan/
│   └── PROPOSAL.md           # ソース言語
├── 02-spec/
│   └── ...
├── translations/             # 翻訳版（レビュー済み正式版）
│   ├── en/                   # 英語翻訳
│   │   ├── 01-plan/
│   │   │   └── PROPOSAL.md
│   │   └── 02-spec/
│   │       └── ...
│   └── vi/                   # ベトナム語翻訳
│       └── ...
└── internal/                 # チーム内部資料（各自の言語OK）
\`\`\`

**ポイント**
- \`docs/\` 直下 = ソース言語（原本、Single Source of Truth）
- \`docs/translations/{lang}/\` = 翻訳版（レビュー済み正式版）
- 翻訳版はソース言語と同じフォルダ構成を維持する
- 翻訳が追いついていない場合は翻訳版を作成しない（部分的な翻訳は避ける）

### 8.3 言語選択ルール

| 対象 | 言語 | 理由 |
|------|------|------|
| ソースドキュメント | プロジェクト設定による | 原本の品質を最優先 |
| 翻訳版 | 必要な言語 | 対象読者に合わせて作成 |
| コード/コメント | 英語 | コード=共有資産 |
| PR/レビュー | 英語推奨 | 非同期コミュニケーション |

### 8.4 設定ファイル

**docs.config.json**
\`\`\`json
{
  "sourceLanguage": "ja",
  "translations": ["en", "vi"],
  "translationDir": "translations"
}
\`\`\`

### 8.5 翻訳ルール

| 規則 | 説明 |
|------|------|
| ソース優先 | ソース言語で品質高く書き、翻訳版を作成 |
| 同期更新 | ソース更新時は翻訳版も更新（または翻訳版を削除） |
| 構成維持 | 翻訳版はソースと同じフォルダ構成を維持 |
| 技術用語 | 原則英語のまま使用（API, KMS, OAuth等） |
| 固有名詞 | 製品名・会社名は原語のまま |

### 8.6 翻訳品質基準

- 機械翻訳のみは禁止（レビュー必須）
- 専門用語の一貫性を維持（用語集を参照）
- 文化的な表現の適切な置き換え
- 翻訳版にはソースのバージョン情報を記載

### 8.7 本プロジェクトの設定

<!-- プロジェクトに合わせて設定してください -->
| 項目 | 値 |
|------|-----|
| ソース言語 | [要設定: ja / en / etc.] |
| 翻訳言語 | [要設定: en, vi, etc.] |
| コード内コメント | 英語推奨 |

---

## 9. レビューチェックリスト

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

## 10. コーディング標準

> **AI向け指示**: このセクションは人間・AI両方が遵守すべきルールです。特に「10.5 AI向け追加ルール」は必ず守ってください。

### 10.1 Git操作ルール

#### 基本原則

| ルール | 説明 | 違反時の影響 |
|--------|------|-------------|
| **main/master直接push禁止** | 必ずfeatureブランチからPRを作成 | コードレビューなしの変更混入 |
| **force push禁止** | \`--force\` オプションは原則使用禁止 | 他者の作業を破壊する可能性 |
| **push前テスト必須** | 全テストがパスしてからpush | CIの無駄な失敗、他者のブロック |
| **コミットメッセージ規約** | Conventional Commits形式を推奨 | 変更履歴の追跡困難 |

#### ブランチ命名規則

\`\`\`text
feature/FR-001-user-authentication   # 機能追加
fix/BUG-042-login-error              # バグ修正
hotfix/critical-security-patch       # 緊急修正
refactor/cleanup-auth-module         # リファクタリング
docs/update-api-documentation        # ドキュメント更新
\`\`\`

#### コミットメッセージ形式

\`\`\`text
<type>(<scope>): <subject>

<body>

<footer>
\`\`\`

| type | 用途 |
|------|------|
| feat | 新機能 |
| fix | バグ修正 |
| docs | ドキュメントのみ |
| style | フォーマット（コード動作に影響なし） |
| refactor | リファクタリング |
| test | テスト追加・修正 |
| chore | ビルド・ツール変更 |

### 10.2 コード品質ルール

#### 必須ルール

| ルール | 詳細 |
|--------|------|
| **既存スタイルに従う** | プロジェクトの既存コードスタイル・命名規則を踏襲 |
| **既存ファイル優先** | 新規ファイル作成より既存ファイル編集を優先 |
| **最小限の変更** | 依頼された範囲のみ変更、過剰な「改善」は禁止 |
| **型安全性** | TypeScript使用時は \`any\` を避け、適切な型定義 |
| **エラーハンドリング** | 例外を握りつぶさない、適切にログ出力 |

#### セキュリティルール（OWASP Top 10対応）

| 脆弱性 | 対策 |
|--------|------|
| **インジェクション** | パラメータ化クエリ、入力値エスケープ |
| **認証の欠陥** | セッション管理の適切な実装 |
| **機密データ露出** | 環境変数使用、ログに秘密情報を出力しない |
| **XXE** | 外部エンティティの無効化 |
| **アクセス制御の欠陥** | 適切な認可チェック |
| **セキュリティ設定ミス** | デフォルト認証情報の排除 |
| **XSS** | 出力エスケープ、CSP設定 |
| **安全でないデシリアライズ** | 信頼できないデータのデシリアライズ禁止 |
| **脆弱なコンポーネント** | 依存関係の定期的な更新 |
| **不十分なログ・監視** | セキュリティイベントのログ記録 |

#### 禁止事項

\`\`\`typescript
// ❌ 禁止: ハードコードされた秘密情報
const API_KEY = "sk-xxxxxxxxxxxxx";
const PASSWORD = "admin123";

// ✅ 正解: 環境変数を使用
const API_KEY = process.env.API_KEY;
const PASSWORD = process.env.DB_PASSWORD;

// ❌ 禁止: 安全でないSQL
const query = \`SELECT * FROM users WHERE id = \${userId}\`;

// ✅ 正解: パラメータ化クエリ
const query = "SELECT * FROM users WHERE id = ?";
db.query(query, [userId]);

// ❌ 禁止: eval() の使用
eval(userInput);

// ✅ 正解: 安全な代替手段を使用
JSON.parse(userInput);
\`\`\`

### 10.3 開発フロー

#### 変更前チェック

1. **現状の理解**
   - 関連コードを読んで理解
   - 既存テストを実行して現状確認
   - 依存関係を把握

2. **計画の確認**
   - 大きな変更は事前に計画を共有
   - 破壊的変更がある場合は明示

#### 変更後チェック

1. **テスト実行**
   \`\`\`bash
   npm test                    # 全テスト実行
   npm run lint               # リント
   npm run typecheck          # 型チェック（TypeScript）
   npm run build              # ビルド確認
   \`\`\`

2. **セルフレビュー**
   - diff を確認して意図しない変更がないか
   - デバッグコード（console.log等）の削除
   - 不要なコメントアウトの削除

### 10.4 依存関係管理

| ルール | 説明 |
|--------|------|
| **勝手な追加禁止** | 新しいライブラリ追加は事前確認 |
| **バージョン固定** | package-lock.json / yarn.lock をコミット |
| **脆弱性チェック** | \`npm audit\` で定期確認 |
| **不要な依存削除** | 使わなくなったパッケージは削除 |

### 10.5 AI向け追加ルール

> **重要**: AIアシスタント（Claude等）がコード作業を行う際の追加ルールです。

#### 確認が必要な操作

| 操作 | ルール |
|------|--------|
| **git push** | ❌ 勝手に実行しない。必ずユーザーに確認を取る |
| **git push --force** | ❌ 絶対に実行しない |
| **main/masterへのpush** | ❌ 絶対に実行しない |
| **ファイル削除** | ⚠️ 削除前に確認を取る |
| **package.json変更** | ⚠️ 依存関係の追加・削除は確認を取る |
| **設定ファイル変更** | ⚠️ 環境に影響する変更は確認を取る |
| **データベース操作** | ⚠️ 破壊的操作（DROP, TRUNCATE等）は確認必須 |

#### push前の必須手順

\`\`\`bash
# 1. テスト実行
npm test

# 2. リント
npm run lint

# 3. 型チェック（TypeScript）
npm run typecheck

# 4. ビルド確認
npm run build

# 5. 全てパスしたらユーザーに確認
# 「テストが全てパスしました。pushしてよろしいですか？」
\`\`\`

#### コード変更時の原則

| 原則 | 説明 |
|------|------|
| **最小限の変更** | 依頼された範囲のみ変更する |
| **既存スタイル遵守** | プロジェクトの既存コードに合わせる |
| **勝手な改善禁止** | 依頼されていないリファクタリング・最適化は行わない |
| **コメント追加抑制** | 不要なコメント・ドキュメントを勝手に追加しない |
| **エラー時の報告** | エラーが発生したら勝手に修正せず、まず報告する |

#### 禁止事項

- ❌ テストを通さずにpush
- ❌ エラーを無視してpush
- ❌ 確認なしでブランチ削除
- ❌ 確認なしで他人のコードを上書き
- ❌ 秘密情報（APIキー、パスワード等）をコードに含める
- ❌ .envファイルをコミット
- ❌ node_modules をコミット

#### 報告が必要な状況

| 状況 | 対応 |
|------|------|
| テストが失敗した | 失敗内容を報告し、修正方針を確認 |
| 既存コードにバグを発見 | 報告し、修正の要否を確認 |
| 依存関係の脆弱性を発見 | 報告し、対応方針を確認 |
| 大きなリファクタリングが必要 | 計画を提示し、承認を得る |
| 要件が曖昧 | 推測せず、確認を取る |

---

## 11. AIレビュー指示

> **AI向け指示**: このセクションは、AIがドキュメントや実装をレビューする際の指示です。\`docs-lint review:spec\` コマンドでも参照されます。

### 11.1 レビュー時のペルソナ

レビュー時は以下の4つの視点を持って評価してください：

| ペルソナ | 観点 | チェック項目 |
|---------|------|-------------|
| **アーキテクト** | システム整合性 | 技術選定の妥当性、コンポーネント間の依存関係、スケーラビリティ |
| **エンジニア** | 実装品質 | コードと設計の一致、APIの正確性、エラーハンドリング |
| **テスト設計者** | 追跡可能性 | FR-XXXとTC-XXXの対応、カバレッジ、境界値テスト |
| **セキュリティエンジニア** | セキュリティ | OWASP Top 10、認証・認可、データ保護 |

### 11.2 ドキュメントレビューチェックリスト

#### 構造チェック
- [ ] 標準フォルダ構成（01-plan, 02-spec, 03-guide, 04-development）に従っているか
- [ ] フォルダ番号が連番（01, 02, 03...）になっているか
- [ ] ファイル名がUPPER-CASE.md形式か
- [ ] 必須ファイル（README.md, PROPOSAL.md, REQUIREMENTS.md）が存在するか

#### 内容チェック
- [ ] バージョン情報・更新日が記載されているか
- [ ] 関連ドキュメントセクションがあるか
- [ ] 見出し階層が適切か（H1→H2→H3）
- [ ] TODO/FIXME/[TBD]が残っていないか
- [ ] コードブロックに言語指定があるか
- [ ] 用語が統一されているか

#### 役割分担チェック
- [ ] 01-plan（WHY/WHAT）: 背景、目的、スコープ、ロードマップ
- [ ] 02-spec（HOW）: 要件、設計、API、テスト
- [ ] 03-guide: 利用者向けガイド、運用手順
- [ ] 04-development: 開発者向け標準、CI/CD
- [ ] 計画と仕様の役割が混在していないか

#### 要件追跡チェック（02-spec がある場合）
- [ ] 全機能要件にFR-XXX形式のIDが付与されているか
- [ ] 全テストケースにTC-XXX形式のIDが付与されているか
- [ ] 各要件に対応するテストケースが存在するか（100%カバレッジ）
- [ ] テストケースの「対象要件」列が正しいか
- [ ] TC-D（延期）/TC-X（対象外）の理由が明記されているか

### 11.3 設計・実装整合性チェックリスト

#### ARCHITECTURE.md
- [ ] 記載されたコンポーネント構成が実装されているか
- [ ] 依存関係が設計通りか
- [ ] 技術スタックが一致しているか
- [ ] データフローが実装と一致しているか

#### CLASS.md
- [ ] クラス/インターフェースが設計通りに実装されているか
- [ ] メソッドシグネチャが一致しているか
- [ ] 型定義が一致しているか
- [ ] クラス間の関係（継承、集約等）が正しいか

#### API.md
- [ ] エンドポイントが設計通りに実装されているか
- [ ] リクエスト/レスポンス形式が一致しているか
- [ ] エラーコード・エラーレスポンスが一致しているか
- [ ] 認証・認可の実装が仕様通りか

#### ERROR-HANDLING.md
- [ ] エラーコードが定義通りに使用されているか
- [ ] エラーメッセージが一致しているか
- [ ] リトライ戦略が実装されているか
- [ ] ログ出力が仕様通りか

### 11.4 レビュー結果の出力形式

レビュー結果は以下の形式で報告してください：

\`\`\`markdown
## レビュー結果

### 総合評価
- **品質スコア**: XX/100
- **判定**: 合格 / 要改善 / 不合格

### 検出された問題

| カテゴリ | 重要度 | ファイル | 問題 | 修正提案 |
|---------|--------|---------|------|---------|
| structure | error | path/file.md | 問題の説明 | 修正案 |

### 良い点
- [良い点1]
- [良い点2]

### 改善提案（優先度順）
1. [最優先の改善]
2. [次の改善]
\`\`\`

### 11.5 品質スコア基準

| スコア | 判定 | 基準 |
|--------|------|------|
| 90-100 | 合格 | 軽微な警告のみ、本番リリース可能 |
| 70-89 | 要改善 | 警告あり、改善後にリリース推奨 |
| 50-69 | 要修正 | エラーあり、修正必須 |
| 0-49 | 不合格 | 重大な問題あり、大幅な見直しが必要 |

---

## 関連ドキュメント

- [README](./README.md) - ドキュメント目次
`;
/**
 * Get the default standards content
 */
export function getDefaultStandards() {
    return DEFAULT_STANDARDS_TEMPLATE;
}
//# sourceMappingURL=standards.js.map