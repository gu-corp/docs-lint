import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import type {
  Requirement,
  RequirementCoverage,
  CoverageReport,
  AnalyzerOptions,
} from './types.js';

const EXTRACT_REQUIREMENTS_PROMPT = `あなたは仕様書から要件を抽出する専門家です。

以下の仕様書から、テストすべき機能要件を抽出してください。
各要件には以下の情報を含めてください：
- id: 一意の識別子（REQ-001形式、または文書内にあればそれを使用）
- description: 要件の説明（テストで検証すべき内容）
- category: カテゴリ（functional/api/ui/security/performance）
- priority: 優先度（high/medium/low）- 明示されていなければmedium

JSON配列形式で出力してください。
\`\`\`json
[
  {
    "id": "REQ-001",
    "description": "ユーザーはメールアドレスとパスワードでログインできる",
    "category": "functional",
    "priority": "high"
  }
]
\`\`\`

仕様書:
`;

const CHECK_TEST_COVERAGE_PROMPT = `あなたはテストレビューの専門家です。

以下の要件が、提供されたテストコードで適切にテストされているかを確認してください。

要件:
{requirement}

テストファイル一覧:
{testFiles}

判定基準:
- implemented: 要件を完全にカバーするテストが存在する
- partial: 一部のケースはテストされているが、不足がある
- not_implemented: 要件に対応するテストが見つからない
- unknown: 判定不能

JSON形式で出力してください：
\`\`\`json
{
  "status": "implemented" | "partial" | "not_implemented" | "unknown",
  "confidence": 0-100,
  "testedIn": ["関連するテストファイルパス"],
  "evidence": "判定理由の説明",
  "missingTests": ["不足しているテストケースの説明（オプション）"]
}
\`\`\`
`;

export class RequirementAnalyzer {
  private client: Anthropic;
  private options: AnalyzerOptions;
  private model: string;

  constructor(options: AnalyzerOptions) {
    this.client = new Anthropic();
    this.options = options;
    this.model = options.model || 'claude-sonnet-4-20250514';
  }

  /**
   * Analyze requirement coverage against tests
   */
  async analyze(): Promise<CoverageReport> {
    // 1. Get spec files
    const specFiles = await this.getSpecFiles();
    if (specFiles.length === 0) {
      throw new Error('No specification files found');
    }

    // 2. Extract requirements from specs
    if (this.options.verbose) {
      console.log('\n📄 Extracting requirements from specs...');
    }
    const requirements = await this.extractRequirements(specFiles);
    if (requirements.length === 0) {
      throw new Error('No requirements found in specification files');
    }
    if (this.options.verbose) {
      console.log(`   Found ${requirements.length} requirements\n`);
    }

    // 3. Get test files
    const testFiles = await this.getTestFiles();
    if (this.options.verbose) {
      console.log(`🧪 Found ${testFiles.length} test files\n`);
    }

    // 4. Check test coverage for each requirement
    if (this.options.verbose) {
      console.log('🔍 Checking test coverage for requirements...');
    }
    const coverages: RequirementCoverage[] = [];
    for (const req of requirements) {
      if (this.options.verbose) {
        console.log(`   ${req.id}: ${req.description.substring(0, 50)}...`);
      }
      const coverage = await this.checkTestCoverage(req, testFiles);
      coverages.push(coverage);
    }

    // 5. Generate report
    return this.generateReport(coverages);
  }

  /**
   * Get specification files
   */
  private async getSpecFiles(): Promise<string[]> {
    const patterns = this.options.specPatterns || [
      '**/*SPEC*.md',
      '**/*FUNCTIONAL*.md',
      '**/*API*.md',
      '**/*SCREEN*.md',
      '**/*REQUIREMENTS*.md',
    ];
    const allFiles: string[] = [];

    for (const pattern of patterns) {
      const files = await glob(pattern, {
        cwd: path.resolve(this.options.docsDir),
        ignore: ['**/node_modules/**'],
      });
      allFiles.push(...files.map(f => path.join(this.options.docsDir, f)));
    }

    return [...new Set(allFiles)];
  }

  /**
   * Get test files
   */
  private async getTestFiles(): Promise<string[]> {
    const patterns = ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'];
    const allFiles: string[] = [];
    const searchDirs = [this.options.srcDir, 'tests', 'test', '__tests__'];

    for (const dir of searchDirs) {
      const resolvedDir = path.resolve(dir);
      if (!fs.existsSync(resolvedDir)) continue;

      for (const pattern of patterns) {
        try {
          const files = await glob(pattern, {
            cwd: resolvedDir,
            ignore: ['**/node_modules/**', '**/dist/**'],
          });
          allFiles.push(...files.map(f => path.join(dir, f)));
        } catch {
          // Directory might not exist
        }
      }
    }

    return [...new Set(allFiles)];
  }

  /**
   * Extract requirements from spec files using AI
   */
  private async extractRequirements(specFiles: string[]): Promise<Requirement[]> {
    const allRequirements: Requirement[] = [];

    for (const file of specFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const relativePath = path.relative(this.options.docsDir, file);

      if (this.options.verbose) {
        console.log(`   Reading: ${relativePath}`);
      }

      try {
        const response = await this.client.messages.create({
          model: this.model,
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: EXTRACT_REQUIREMENTS_PROMPT + content,
            },
          ],
        });

        const text = response.content[0].type === 'text' ? response.content[0].text : '';
        const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);

        if (jsonMatch) {
          const reqs = JSON.parse(jsonMatch[1]) as Array<{
            id: string;
            description: string;
            category: string;
            priority?: string;
          }>;

          for (const req of reqs) {
            allRequirements.push({
              id: req.id,
              description: req.description,
              category: req.category,
              sourceFile: relativePath,
              priority: (req.priority as 'high' | 'medium' | 'low') || 'medium',
            });
          }
        }
      } catch (error) {
        if (this.options.verbose) {
          console.error(`   Error: ${relativePath}`, error);
        }
      }
    }

    return allRequirements;
  }

  /**
   * Check if a requirement has corresponding tests
   */
  private async checkTestCoverage(
    requirement: Requirement,
    testFiles: string[]
  ): Promise<RequirementCoverage> {
    if (testFiles.length === 0) {
      return {
        requirement,
        status: 'not_implemented',
        confidence: 100,
        implementedIn: [],
        evidence: 'No test files found in the project',
      };
    }

    // Create test file summary for AI
    const testSummary = testFiles
      .map(f => {
        const content = fs.readFileSync(f, 'utf-8');
        // Truncate large files
        const truncated = content.length > 3000
          ? content.substring(0, 3000) + '\n... (truncated)'
          : content;
        return `=== ${f} ===\n${truncated}`;
      })
      .join('\n\n');

    const prompt = CHECK_TEST_COVERAGE_PROMPT
      .replace('{requirement}', `[${requirement.id}] ${requirement.description}\nCategory: ${requirement.category}\nPriority: ${requirement.priority}\nSource: ${requirement.sourceFile}`)
      .replace('{testFiles}', testSummary);

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
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
          status: 'implemented' | 'partial' | 'not_implemented' | 'unknown';
          confidence: number;
          testedIn: string[];
          evidence: string;
          missingTests?: string[];
        };

        return {
          requirement,
          status: result.status,
          confidence: result.confidence,
          implementedIn: result.testedIn,
          evidence: result.evidence,
          suggestion: result.missingTests?.join('; '),
        };
      }
    } catch (error) {
      if (this.options.verbose) {
        console.error(`   Error checking ${requirement.id}:`, error);
      }
    }

    return {
      requirement,
      status: 'unknown',
      confidence: 0,
      implementedIn: [],
      evidence: 'Analysis failed',
    };
  }

  /**
   * Generate coverage report
   */
  private generateReport(coverages: RequirementCoverage[]): CoverageReport {
    const stats = {
      implemented: 0,
      partial: 0,
      notImplemented: 0,
      unknown: 0,
    };

    const byCategory: Record<string, { total: number; implemented: number; percentage: number }> = {};

    for (const cov of coverages) {
      // Count by status
      switch (cov.status) {
        case 'implemented':
          stats.implemented++;
          break;
        case 'partial':
          stats.partial++;
          break;
        case 'not_implemented':
          stats.notImplemented++;
          break;
        default:
          stats.unknown++;
      }

      // Count by category
      const cat = cov.requirement.category;
      if (!byCategory[cat]) {
        byCategory[cat] = { total: 0, implemented: 0, percentage: 0 };
      }
      byCategory[cat].total++;
      if (cov.status === 'implemented') {
        byCategory[cat].implemented++;
      }
    }

    // Calculate percentages
    for (const cat of Object.keys(byCategory)) {
      byCategory[cat].percentage = Math.round(
        (byCategory[cat].implemented / byCategory[cat].total) * 100
      );
    }

    const total = coverages.length;
    const implemented = stats.implemented + stats.partial * 0.5;
    const percentage = total > 0 ? Math.round((implemented / total) * 100) : 0;

    return {
      totalRequirements: total,
      coverage: stats,
      percentage,
      details: coverages,
      byCategory,
    };
  }
}

/**
 * Create analyzer instance
 */
export function createAnalyzer(options: AnalyzerOptions): RequirementAnalyzer {
  return new RequirementAnalyzer(options);
}
