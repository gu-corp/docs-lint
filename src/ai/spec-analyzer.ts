import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import type {
  SpecReviewOptions,
  SpecReviewReport,
  SpecIssue,
  DocumentInfo,
} from './types.js';
import { readStandardsFile } from './prompt.js';

const REVIEW_DOCS_PROMPT = `あなたはドキュメント品質レビューの専門家です。

**あなたのペルソナ:**
以下の視点を持って評価してください：
- **アーキテクト**: システム全体の整合性、設計の一貫性
- **エンジニア**: 実装可能性、技術的正確性
- **テスト設計者**: テスト可能性、要件の追跡可能性
- **セキュリティエンジニア**: セキュリティ考慮事項の有無

以下のドキュメント群を分析し、品質上の問題を特定してください。

## チェック項目

1. **structure（構造）**:
   - 必須セクション（概要、本文、関連ドキュメント）の有無
   - 見出し階層の適切さ（H1→H2→H3の順）
   - バージョン情報・更新日の有無
   - フォルダ構成の適切さ（01-plan, 02-spec, 03-guide, 04-development）
   - ファイル命名規則（UPPER-CASE.md）
   - フォルダ番号の連番（01, 02, 03...）

2. **terminology（用語）**:
   - 用語の一貫性（同じ概念に異なる用語を使用していないか）
   - 禁止用語の使用

3. **consistency（整合性）**:
   - ドキュメント間の矛盾
   - 相互参照の整合性
   - 01-plan（WHY/WHAT）と02-spec（HOW）の役割分担
   - 計画と仕様の整合性

4. **completeness（完全性）**:
   - TODO/FIXMEの残存
   - [TBD]や[未定]の残存
   - 空セクションの存在
   - プレースホルダーの残存

5. **reference（参照）**:
   - リンク切れの可能性
   - 存在しないファイルへの参照

6. **traceability（追跡可能性）** - 02-spec がある場合:
   - FR-XXX形式の要件IDの有無と形式
   - TC-XXX形式のテストケースIDの有無と形式
   - 要件とテストケースの対応関係
   - 未テストの要件（要件カバレッジ）
   - テストケース表の「対象要件」列の正確性

7. **multilingual（多言語）** - translations/ がある場合:
   - ソース言語版と翻訳版の同期状態
   - 翻訳漏れの有無

{standards}

## 出力形式

JSON配列で問題を出力してください：
\`\`\`json
{
  "issues": [
    {
      "category": "structure|terminology|consistency|completeness|reference",
      "severity": "error|warning|info",
      "file": "ファイルパス",
      "line": 行番号（オプション）,
      "message": "問題の説明",
      "suggestion": "修正提案（オプション）",
      "confidence": 0-100
    }
  ],
  "qualityScore": 0-100,
  "summary": "全体の評価サマリー（2-3文）",
  "recommendations": ["改善提案1", "改善提案2", ...]
}
\`\`\`

## ドキュメント一覧

`;

const TERMINOLOGY_CHECK_PROMPT = `あなたは用語一貫性チェッカーです。

以下のドキュメント群で、用語の一貫性をチェックしてください。

## 用語ルール
{terminology}

## チェック対象
{documents}

不一貫な用語使用を見つけた場合、JSON形式で報告してください：
\`\`\`json
{
  "issues": [
    {
      "file": "ファイルパス",
      "line": 行番号,
      "found": "見つかった用語",
      "preferred": "推奨用語",
      "context": "周辺のテキスト"
    }
  ]
}
\`\`\`
`;

export class SpecAnalyzer {
  private client: Anthropic;
  private options: SpecReviewOptions;
  private model: string;

  constructor(options: SpecReviewOptions) {
    this.client = new Anthropic();
    this.options = options;
    this.model = options.model || 'claude-sonnet-4-20250514';
  }

  /**
   * Review all documentation for quality issues
   */
  async review(): Promise<SpecReviewReport> {
    // 1. Get all markdown files
    const files = await this.getDocFiles();
    if (files.length === 0) {
      throw new Error('No documentation files found');
    }

    if (this.options.verbose) {
      console.log(`\n📄 Found ${files.length} documentation files\n`);
    }

    // 2. Read document contents
    const documents = await this.readDocuments(files);

    // 3. Get standards if available
    const standards = this.options.standards || this.loadStandards();

    // 4. Run AI analysis
    if (this.options.verbose) {
      console.log('🔍 Analyzing document quality...\n');
    }
    const report = await this.analyzeDocuments(documents, standards);

    // 5. Add terminology check if configured
    if (this.options.terminology && this.options.terminology.length > 0) {
      if (this.options.verbose) {
        console.log('📝 Checking terminology consistency...\n');
      }
      const termIssues = await this.checkTerminology(documents);
      report.issues.push(...termIssues);
    }

    // 6. Calculate category stats
    report.byCategory = this.calculateCategoryStats(report.issues);

    // 7. Calculate passed documents
    const filesWithIssues = new Set(report.issues.filter(i => i.severity !== 'info').map(i => i.file));
    report.passedDocuments = documents.length - filesWithIssues.size;

    return report;
  }

  /**
   * Get all markdown files in docs directory
   */
  private async getDocFiles(): Promise<string[]> {
    const docsDir = path.resolve(this.options.docsDir);
    const files = await glob('**/*.md', {
      cwd: docsDir,
      ignore: ['**/node_modules/**', '**/drafts/**'],
    });
    return files.map(f => path.join(docsDir, f));
  }

  /**
   * Read and parse documents
   */
  private async readDocuments(files: string[]): Promise<DocumentInfo[]> {
    const documents: DocumentInfo[] = [];
    const docsDir = path.resolve(this.options.docsDir);

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const relativePath = path.relative(docsDir, file);

      // Extract metadata
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const headings = [...content.matchAll(/^(#{1,6})\s+(.+)$/gm)].map(m => m[2]);
      const hasVersion = /\*\*(バージョン|Version)\*\*:\s*\d+/.test(content);
      const hasRelatedDocs = /(関連ドキュメント|Related Documents)/i.test(content);

      documents.push({
        path: relativePath,
        title: titleMatch?.[1],
        content,
        hasVersion,
        hasRelatedDocs,
        headings,
      });

      if (this.options.verbose) {
        console.log(`   📄 ${relativePath} (${headings.length} sections)`);
      }
    }

    return documents;
  }

  /**
   * Load document standards
   */
  private loadStandards(): string {
    const standards = readStandardsFile(this.options.docsDir);
    if (standards.isDefault) {
      return '※ プロジェクト固有の標準がないため、G.U.Corp デフォルト標準を使用';
    }
    return `## ドキュメント標準規約\n\n${standards.content.substring(0, 3000)}...`;
  }

  /**
   * Analyze documents using AI
   */
  private async analyzeDocuments(
    documents: DocumentInfo[],
    standards: string
  ): Promise<SpecReviewReport> {
    // Prepare document summary for AI
    const docSummary = documents
      .map(doc => {
        // Truncate content for large documents
        const truncatedContent = doc.content.length > 2000
          ? doc.content.substring(0, 2000) + '\n... (truncated)'
          : doc.content;

        return `=== ${doc.path} ===
Title: ${doc.title || '(none)'}
Has Version: ${doc.hasVersion}
Has Related Docs: ${doc.hasRelatedDocs}
Headings: ${doc.headings.join(', ')}

${truncatedContent}`;
      })
      .join('\n\n---\n\n');

    const prompt = REVIEW_DOCS_PROMPT
      .replace('{standards}', standards ? `\n## 適用標準\n\n${standards}\n` : '')
      + docSummary;

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);

      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[1]) as {
          issues: SpecIssue[];
          qualityScore: number;
          summary: string;
          recommendations: string[];
        };

        return {
          totalDocuments: documents.length,
          issues: result.issues || [],
          byCategory: {},
          qualityScore: result.qualityScore || 0,
          passedDocuments: 0,
          summary: result.summary || '',
          recommendations: result.recommendations || [],
        };
      }
    } catch (error) {
      if (this.options.verbose) {
        console.error('AI analysis error:', error);
      }
    }

    return {
      totalDocuments: documents.length,
      issues: [],
      byCategory: {},
      qualityScore: 0,
      passedDocuments: 0,
      summary: 'Analysis failed',
      recommendations: [],
    };
  }

  /**
   * Check terminology consistency
   */
  private async checkTerminology(documents: DocumentInfo[]): Promise<SpecIssue[]> {
    if (!this.options.terminology || this.options.terminology.length === 0) {
      return [];
    }

    const termRules = this.options.terminology
      .map(t => `- "${t.preferred}" (禁止: ${t.variants.join(', ')})`)
      .join('\n');

    const docContent = documents
      .map(d => `=== ${d.path} ===\n${d.content.substring(0, 1500)}`)
      .join('\n\n');

    const prompt = TERMINOLOGY_CHECK_PROMPT
      .replace('{terminology}', termRules)
      .replace('{documents}', docContent);

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);

      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[1]) as {
          issues: Array<{
            file: string;
            line?: number;
            found: string;
            preferred: string;
            context?: string;
          }>;
        };

        return (result.issues || []).map(issue => ({
          category: 'terminology' as const,
          severity: 'warning' as const,
          file: issue.file,
          line: issue.line,
          message: `用語「${issue.found}」を使用 → 「${issue.preferred}」を推奨`,
          suggestion: issue.context,
          confidence: 90,
        }));
      }
    } catch (error) {
      if (this.options.verbose) {
        console.error('Terminology check error:', error);
      }
    }

    return [];
  }

  /**
   * Calculate category statistics
   */
  private calculateCategoryStats(
    issues: SpecIssue[]
  ): Record<string, { total: number; errors: number; warnings: number }> {
    const stats: Record<string, { total: number; errors: number; warnings: number }> = {};

    for (const issue of issues) {
      if (!stats[issue.category]) {
        stats[issue.category] = { total: 0, errors: 0, warnings: 0 };
      }
      stats[issue.category].total++;
      if (issue.severity === 'error') {
        stats[issue.category].errors++;
      } else if (issue.severity === 'warning') {
        stats[issue.category].warnings++;
      }
    }

    return stats;
  }
}

/**
 * Create spec analyzer instance
 */
export function createSpecAnalyzer(options: SpecReviewOptions): SpecAnalyzer {
  return new SpecAnalyzer(options);
}
