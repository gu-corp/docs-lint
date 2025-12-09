import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { readStandardsFile } from './prompt.js';

interface ReviewPromptOptions {
  docsDir: string;
  srcDir?: string;
  verbose?: boolean;
}

/**
 * Generate a review prompt for chat AI (Claude Code) instead of API call
 * This allows using the current chat context without API key
 */
export function generateSpecReviewPrompt(options: ReviewPromptOptions): string {
  const { docsDir, srcDir } = options;
  const sections: string[] = [];

  // Get standards
  const standards = readStandardsFile(docsDir);

  // Header
  sections.push(`# ドキュメント・実装レビュー依頼

以下の指示に従って、プロジェクトのドキュメントと実装をレビューしてください。

---`);

  // AI Persona and Role
  sections.push(`## あなたのペルソナ

以下の4つの視点を持ってレビューしてください：

1. **アーキテクト**: システム全体の整合性、設計の一貫性、技術選定の妥当性
2. **エンジニア**: 実装可能性、技術的正確性、コードとドキュメントの一致
3. **テスト設計者**: テスト可能性、要件の追跡可能性、カバレッジ
4. **セキュリティエンジニア**: セキュリティ考慮事項、脆弱性リスク

---`);

  // Standards
  const standardsNote = standards.isDefault
    ? '（G.U.Corp デフォルト標準を使用）'
    : '（プロジェクト固有の標準）';

  sections.push(`## ドキュメント標準規約 ${standardsNote}

<document-standards>
${standards.content}
</document-standards>

---`);

  // Review Instructions
  sections.push(`## レビュー手順

### Step 1: ドキュメント構造の確認

\`docs/\` フォルダを確認し、以下をチェックしてください：

- [ ] 標準フォルダ構成（01-plan, 02-spec, 03-guide, 04-development）
- [ ] フォルダ番号の連番（01, 02, 03...）
- [ ] ファイル命名規則（UPPER-CASE.md）
- [ ] 必須ファイルの存在（README.md）

### Step 2: 要件・テストの追跡可能性

\`docs/02-spec/\` がある場合：

- [ ] FR-XXX形式の要件IDが定義されているか
- [ ] TC-XXX形式のテストケースIDが定義されているか
- [ ] 各要件に対応するテストケースが存在するか
- [ ] 要件カバレッジは十分か（未テスト要件がないか）

### Step 3: 計画と仕様の役割分担

- [ ] 01-plan（WHY/WHAT）: 背景、目的、スコープ
- [ ] 02-spec（HOW）: 要件、設計、API、テスト
- [ ] 役割が混在していないか

### Step 4: ドキュメント品質

各ドキュメントについて：

- [ ] バージョン情報・更新日が記載されているか
- [ ] 関連ドキュメントセクションがあるか
- [ ] 見出し階層が適切か（H1→H2→H3）
- [ ] TODO/FIXME/[TBD]が残っていないか
- [ ] コードブロックに言語指定があるか`);

  // Source code review (if srcDir specified)
  if (srcDir) {
    sections.push(`### Step 5: 設計と実装の整合性

\`${srcDir}/\` のコードを確認し、ドキュメントとの整合性をチェックしてください：

- [ ] 設計ドキュメント（ARCHITECTURE.md, CLASS.md, API.md）と実装が一致しているか
- [ ] 要件（REQUIREMENTS.md）が実装されているか
- [ ] APIの実装が API.md の仕様と一致しているか
- [ ] エラーハンドリングが ERROR-HANDLING.md に従っているか
- [ ] テストコードがテストケース（TEST-CASES.md）をカバーしているか`);
  }

  // Output Format
  sections.push(`---

## 出力形式

以下の形式でレビュー結果を報告してください：

### 総合評価

- **品質スコア**: X/100
- **合否**: 合格 / 要改善 / 不合格

### 検出された問題

| カテゴリ | 重要度 | ファイル | 問題 | 修正提案 |
|---------|--------|---------|------|---------|
| structure/consistency/completeness/traceability | error/warning/info | ファイルパス | 問題の説明 | 具体的な修正案 |

### 良い点（最大3つ）

- [良い点1]
- [良い点2]

### 改善提案（優先度順）

1. [最優先の改善提案]
2. [次の改善提案]

---

**レビューを開始してください。**`);

  return sections.join('\n\n');
}

/**
 * Generate a design-implementation consistency review prompt
 */
export function generateDesignReviewPrompt(options: ReviewPromptOptions): string {
  const { docsDir, srcDir = './src' } = options;
  const sections: string[] = [];

  sections.push(`# 設計・実装整合性レビュー依頼

以下の指示に従って、設計ドキュメントと実装コードの整合性をレビューしてください。

---`);

  sections.push(`## 対象

- **設計ドキュメント**: \`${docsDir}/02-spec/02-design/\`
- **実装コード**: \`${srcDir}/\`

---`);

  sections.push(`## チェック項目

### 1. アーキテクチャ整合性

ARCHITECTURE.md と実装を比較：

- [ ] 記載されたコンポーネント構成が実装されているか
- [ ] 依存関係が設計通りか
- [ ] 技術スタックが一致しているか

### 2. クラス設計整合性

CLASS.md と実装を比較：

- [ ] クラス/インターフェースが設計通りに実装されているか
- [ ] メソッドシグネチャが一致しているか
- [ ] 型定義が一致しているか

### 3. API整合性

API.md と実装を比較：

- [ ] エンドポイントが設計通りに実装されているか
- [ ] リクエスト/レスポンス形式が一致しているか
- [ ] エラーコードが一致しているか

### 4. エラーハンドリング

ERROR-HANDLING.md と実装を比較：

- [ ] エラーコードが定義通りに使用されているか
- [ ] エラーメッセージが一致しているか
- [ ] リトライ戦略が実装されているか

---`);

  sections.push(`## 出力形式

### 整合性マトリクス

| 設計ドキュメント | 整合性 | 差分の詳細 |
|-----------------|--------|-----------|
| ARCHITECTURE.md | 一致/部分一致/不一致 | [差分の説明] |
| CLASS.md | 一致/部分一致/不一致 | [差分の説明] |
| API.md | 一致/部分一致/不一致 | [差分の説明] |

### 要アクション

1. **ドキュメント更新が必要**: [ドキュメントが古い場合]
2. **実装修正が必要**: [実装が設計と異なる場合]
3. **設計見直しが必要**: [設計自体に問題がある場合]

---

**レビューを開始してください。**`);

  return sections.join('\n\n');
}
