import fs from 'fs';
import path from 'path';
import type { LintResult, DocsLintConfig } from './types.js';

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

  // Header
  sections.push(`# ドキュメント品質評価レポート

このレポートは、AIによるドキュメント品質評価を支援するために生成されました。
以下の情報を元に、ドキュメントの品質と改善点を評価してください。

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
- [ ] フォルダ構成が論理的か
- [ ] 命名規則が統一されているか

### 4.2 内容の一貫性
- [ ] 用語が統一されているか
- [ ] 相互参照が適切か
- [ ] 重複や矛盾がないか

### 4.3 保守性
- [ ] バージョン情報が明記されているか
- [ ] 変更履歴が追跡可能か
- [ ] 関連ドキュメントへのリンクがあるか

### 4.4 完成度
- [ ] TODO/FIXMEが残っていないか
- [ ] プレースホルダーがないか
- [ ] 空セクションがないか`);

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
