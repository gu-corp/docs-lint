import fs from 'fs';
import path from 'path';
import type { LintResult, DocsLintConfig } from '../types.js';
import { getDefaultStandards } from '../templates/standards.js';

export const STANDARDS_FILES = [
  'DOCUMENT_STANDARDS.md',
  'DOCUMENT-STANDARDS.md',
  'DOC_STANDARDS.md',
  'STANDARDS.md',
];

interface DocsLanguageConfig {
  commonLanguage: string;
  translationLanguages?: string[];
  teams?: Record<string, string>;
}

/**
 * Read docs.config.json for language settings
 */
export function readDocsConfig(docsDir: string): DocsLanguageConfig | null {
  const configPath = path.join(docsDir, 'docs.config.json');
  if (fs.existsSync(configPath)) {
    try {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Find and read the document standards file
 * Falls back to default G.U.Corp standards if not found
 */
export function readStandardsFile(docsDir: string, useDefault = true): { content: string; isDefault: boolean } {
  for (const fileName of STANDARDS_FILES) {
    const filePath = path.join(docsDir, fileName);
    if (fs.existsSync(filePath)) {
      return { content: fs.readFileSync(filePath, 'utf-8'), isDefault: false };
    }
  }

  if (useDefault) {
    return { content: getDefaultStandards(), isDefault: true };
  }

  return { content: '', isDefault: true };
}

/**
 * Generate an AI-friendly prompt for document quality assessment
 */
export function generateAIPrompt(
  docsDir: string,
  files: string[],
  lintResult: LintResult,
  config: DocsLintConfig
): string {
  const sections: string[] = [];
  const standards = readStandardsFile(docsDir);

  // Read language config
  const langConfig = readDocsConfig(docsDir);
  const langInfo = langConfig
    ? `
**言語設定:**
- ソース言語: ${langConfig.commonLanguage}
${langConfig.translationLanguages ? `- 翻訳言語: ${langConfig.translationLanguages.join(', ')}` : ''}
${langConfig.teams ? `- チーム: ${Object.entries(langConfig.teams).map(([k, v]) => `${k}(${v})`).join(', ')}` : ''}`
    : '';

  // Header with AI instructions
  sections.push(`# ドキュメント品質評価レポート

<ai-instructions>
## AIへの指示

このレポートは、ドキュメント品質評価を支援するために自動生成されました。

**あなたのペルソナ:**
以下の視点を持って評価してください：
- **アーキテクト**: システム全体の整合性、設計の一貫性
- **エンジニア**: 実装可能性、技術的正確性
- **テスト設計者**: テスト可能性、要件の追跡可能性
- **セキュリティエンジニア**: セキュリティ考慮事項の有無

**評価手順:**
1. **まず「0. ドキュメント標準規約」を熟読してください** - これが評価の基準となります
2. **言語設定を確認してください** - ソース言語と翻訳言語の使い分けが適切か評価します
3. **フォルダの役割分担を確認してください**:
   - 01-plan/: 計画・提案（WHYとWHAT）
   - 02-spec/: 仕様・設計（HOW）- 要件(01-requirements)、設計(02-design)、テスト(04-testing)
   - 03-guide/: 利用者向けガイド
   - 04-development/: 開発者向け標準
4. 検出された問題を確認してください
5. フォルダ構成と品質メトリクスを確認してください
6. 標準規約に基づいて総合評価を行ってください

**重要:**
- 標準規約を理解せずに評価を行わないでください
- docs/直下がソース言語、translations/{lang}/が翻訳版です
- 翻訳版はソース言語版と同期されている必要があります
- FR-XXX形式の要件IDとTC-XXX形式のテストケースIDの対応関係を確認してください
${langInfo}
</ai-instructions>

---`);

  // Standards section (always included - uses default if project-specific not found)
  const standardsNote = standards.isDefault
    ? '（※ G.U.Corp 標準規約を使用。プロジェクト固有の規約は docs/DOCUMENT_STANDARDS.md で定義可能）'
    : '';
  sections.push(`## 0. ドキュメント標準規約 ${standardsNote}

以下は、ドキュメント作成基準です。
評価はこの基準に基づいて行ってください。

<document-standards>
${standards.content}
</document-standards>

---`);

  // Summary
  sections.push(`## 1. 概要

- **ドキュメント総数**: ${files.length}ファイル
- **検査済みルール**: ${lintResult.ruleResults.length}
- **エラー**: ${lintResult.summary.errors}件
- **警告**: ${lintResult.summary.warnings}件
- **合格**: ${lintResult.passed ? 'はい' : 'いいえ'}`);

  // Folder structure
  sections.push(`## 2. フォルダ構成

\`\`\`
${generateFolderTree(docsDir, files)}
\`\`\`
`);

  // Issues summary
  if (lintResult.ruleResults.some((r) => r.issues.length > 0)) {
    sections.push(`## 3. 検出された問題

### 3.1 エラー（修正必須）
${formatIssues(lintResult.ruleResults.filter((r) => r.severity === 'error'))}

### 3.2 警告（改善推奨）
${formatIssues(lintResult.ruleResults.filter((r) => r.severity === 'warn'))}`);
  }

  // Quality metrics
  sections.push(`## 4. 品質メトリクス

以下の観点からドキュメントを評価してください：

### 4.1 構造的完全性
- [ ] 必須ドキュメントが揃っているか
- [ ] フォルダ構成が論理的か（01-plan, 02-spec, 03-guide, 04-development）
- [ ] 命名規則が統一されているか（UPPER-CASE.md）
- [ ] フォルダ番号が連番になっているか（01, 02, 03...）

### 4.2 内容の一貫性
- [ ] 用語が統一されているか
- [ ] 相互参照が適切か
- [ ] 重複や矛盾がないか
- [ ] 01-plan（WHY/WHAT）と02-spec（HOW）の役割分担が適切か

### 4.3 保守性
- [ ] バージョン情報が明記されているか
- [ ] 変更履歴が追跡可能か
- [ ] 関連ドキュメントへのリンクがあるか
- [ ] 各ドキュメントの最終更新日が記載されているか

### 4.4 完成度
- [ ] TODO/FIXMEが残っていないか
- [ ] プレースホルダーがないか
- [ ] 空セクションがないか
- [ ] [TBD]や[未定]が残っていないか

### 4.5 要件追跡（02-spec がある場合）
- [ ] FR-XXX形式の要件IDが定義されているか
- [ ] TC-XXX形式のテストケースIDが定義されているか
- [ ] 各要件に対応するテストケースが存在するか
- [ ] 要件カバレッジは十分か（未テスト要件がないか）
- [ ] テストケースの「対象要件」列が正しく記載されているか`);

  // Evaluation request
  sections.push(`## 5. 評価依頼

上記の情報を元に、以下を評価してください：

1. **総合スコア** (1-10): ドキュメント全体の品質
2. **優先度の高い改善点** (最大5件)
3. **良い点** (最大3件)
4. **次のアクション** (具体的な改善提案)

---

*このプロンプトは @gu-corp/docs-lint によって自動生成されました*`);

  return sections.join('\n\n');
}

/**
 * Generate a folder tree representation
 */
function generateFolderTree(docsDir: string, files: string[]): string {
  const tree: Map<string, string[]> = new Map();

  // Group files by directory
  for (const file of files) {
    const dir = path.dirname(file);
    if (!tree.has(dir)) {
      tree.set(dir, []);
    }
    tree.get(dir)!.push(path.basename(file));
  }

  // Build tree string
  const lines: string[] = ['docs/'];
  const sortedDirs = Array.from(tree.keys()).sort();

  for (const dir of sortedDirs) {
    const depth = dir === '.' ? 0 : dir.split('/').length;
    const indent = '  '.repeat(depth);
    const dirName = dir === '.' ? '' : dir.split('/').pop();

    if (dirName) {
      lines.push(`${indent}├── ${dirName}/`);
    }

    const filesInDir = tree.get(dir)!.sort();
    for (let i = 0; i < filesInDir.length; i++) {
      const isLast = i === filesInDir.length - 1;
      const prefix = isLast ? '└──' : '├──';
      lines.push(`${indent}  ${prefix} ${filesInDir[i]}`);
    }
  }

  return lines.join('\n');
}

/**
 * Format issues for the prompt
 */
function formatIssues(
  ruleResults: { rule: string; issues: { file: string; message: string }[] }[]
): string {
  const lines: string[] = [];

  for (const result of ruleResults) {
    if (result.issues.length === 0) continue;

    lines.push(`\n**${result.rule}** (${result.issues.length}件)`);
    for (const issue of result.issues.slice(0, 5)) {
      lines.push(`- \`${issue.file}\`: ${issue.message}`);
    }
    if (result.issues.length > 5) {
      lines.push(`- ... 他 ${result.issues.length - 5} 件`);
    }
  }

  return lines.length > 0 ? lines.join('\n') : '検出なし';
}

/**
 * Generate a compact JSON summary for API consumption
 */
export function generateJSONSummary(
  docsDir: string,
  files: string[],
  lintResult: LintResult
): object {
  return {
    meta: {
      generatedAt: new Date().toISOString(),
      docsDir,
      tool: '@gu-corp/docs-lint',
    },
    summary: {
      totalFiles: files.length,
      errors: lintResult.summary.errors,
      warnings: lintResult.summary.warnings,
      passed: lintResult.passed,
    },
    rules: lintResult.ruleResults.map((r) => ({
      name: r.rule,
      severity: r.severity,
      issueCount: r.issues.length,
      passed: r.passed,
    })),
    issues: lintResult.ruleResults.flatMap((r) =>
      r.issues.map((i) => ({
        rule: r.rule,
        severity: r.severity,
        file: i.file,
        line: i.line,
        message: i.message,
      }))
    ),
    files: files.map((f) => ({
      path: f,
      issues: lintResult.ruleResults.flatMap((r) =>
        r.issues.filter((i) => i.file === f).map((i) => ({
          rule: r.rule,
          message: i.message,
        }))
      ),
    })),
  };
}
