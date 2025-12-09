# API仕様

**バージョン**: 1.0
**更新日**: 2025-12-10

---

## 概要

docs-lint のプログラマティックAPIを定義します。

## インストール

```bash
npm install github:gu-corp/docs-lint
```

## 基本的な使用方法

```typescript
import { createLinter } from '@gu-corp/docs-lint';

const linter = createLinter({
  docsDir: './docs',
});

const result = await linter.lint();

console.log(`合格: ${result.passed}`);
console.log(`エラー数: ${result.summary.errors}`);
console.log(`警告数: ${result.summary.warnings}`);
```

## API リファレンス

### createLinter(config, options?)

リンターインスタンスを作成します。

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `config` | `Partial<DocsLintConfig>` | 設定オプション |
| `options` | `LinterOptions` | 実行時オプション |

**戻り値**: `Linter` インスタンス

```typescript
import { createLinter, DocsLintConfig } from '@gu-corp/docs-lint';

const config: Partial<DocsLintConfig> = {
  docsDir: './docs',
  include: ['**/*.md'],
  exclude: ['node_modules/**'],
  rules: {
    brokenLinks: 'error',
    todoComments: 'warn',
  },
};

const linter = createLinter(config, {
  verbose: true,
  only: ['brokenLinks', 'todoComments'],
});
```

### linter.lint()

設定されたすべてのルールを実行します。

**戻り値**: `Promise<LintResult>`

```typescript
interface LintResult {
  passed: boolean;
  filesChecked: number;
  summary: {
    errors: number;
    warnings: number;
    passed: number;
  };
  ruleResults: RuleResult[];
}

interface RuleResult {
  rule: string;
  passed: boolean;
  severity: 'error' | 'warn' | 'off';
  issues: Issue[];
}

interface Issue {
  file: string;
  line?: number;
  message: string;
  suggestion?: string;
}
```

### linter.lintStructure(options)

フォルダ構成を検証します。

```typescript
interface StructureOptions {
  folders: Array<{
    path: string;
    required: boolean;
    description?: string;
  }>;
  numberedFolders?: boolean;
  upperCaseFiles?: boolean;
}
```

**戻り値**: `Promise<RuleResult[]>`

```typescript
const results = await linter.lintStructure({
  folders: [
    { path: '01-plan', required: true, description: '計画' },
    { path: '02-spec', required: true, description: '仕様書' },
  ],
  numberedFolders: true,
  upperCaseFiles: true,
});
```

## 個別ルール関数

カスタム統合用に個別ルールをエクスポートしています：

```typescript
import {
  checkBrokenLinks,
  checkHeadingHierarchy,
  checkTodoComments,
  checkCodeBlockLanguage,
} from '@gu-corp/docs-lint';

// リンク切れチェック
const linkIssues = await checkBrokenLinks('./docs', ['README.md', 'guide/API.md']);

// 見出し階層チェック
const headingIssues = await checkHeadingHierarchy('./docs', ['guide/API.md']);
```

## AI プロンプト生成

AI向けの評価プロンプトを生成します：

```typescript
import { generateAIPrompt, generateJSONSummary } from '@gu-corp/docs-lint';

const prompt = generateAIPrompt(docsDir, files, lintResult, config);
console.log(prompt);

const json = generateJSONSummary(docsDir, files, lintResult);
console.log(JSON.stringify(json, null, 2));
```

## 型定義

### DocsLintConfig

```typescript
interface DocsLintConfig {
  docsDir: string;
  include: string[];
  exclude: string[];
  rules: {
    brokenLinks: RuleSeverity;
    legacyFileNames: RuleSeverity;
    versionInfo: RuleSeverity;
    relatedDocuments: RuleSeverity;
    headingHierarchy: RuleSeverity;
    todoComments: RuleSeverity;
    codeBlockLanguage: RuleSeverity;
    orphanDocuments: RuleSeverity;
    terminology: RuleSeverity;
    bidirectionalRefs: RuleSeverity;
    requirementsCoverage: RuleSeverity;
  };
  terminology: TerminologyRule[];
  requiredFiles: string[];
  requirementPatterns: string[];
}

type RuleSeverity = 'off' | 'warn' | 'error';

interface TerminologyRule {
  preferred: string;
  variants: string[];
}
```

---

## 関連ドキュメント

- [クラス設計](./CLASS.md)
- [設定リファレンス](../../03-guide/CONFIGURATION.md)
- [CLIリファレンス](../../03-guide/CLI.md)
