# API Reference

**Version**: 1.0.0
**Updated**: 2025-12-07

---

## Overview

docs-lint can be used programmatically in Node.js applications.

## Installation

```bash
npm install github:gu-corp/docs-lint
```

## Basic Usage

```typescript
import { createLinter } from '@gu-corp/docs-lint';

const linter = createLinter({
  docsDir: './docs',
});

const result = await linter.lint();

console.log(`Passed: ${result.passed}`);
console.log(`Errors: ${result.summary.errors}`);
console.log(`Warnings: ${result.summary.warnings}`);
```

## API

### createLinter(config, options?)

Creates a new linter instance.

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `config` | `Partial<DocsLintConfig>` | Configuration options |
| `options` | `LinterOptions` | Runtime options |

**Returns**: `Linter` instance

**Example**:

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

Runs all configured lint rules.

**Returns**: `Promise<LintResult>`

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

Validates folder structure.

**Parameters**:

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

**Returns**: `Promise<RuleResult[]>`

**Example**:

```typescript
const results = await linter.lintStructure({
  folders: [
    { path: '01-plan', required: true, description: 'Planning docs' },
    { path: '02-spec', required: true, description: 'Specifications' },
  ],
  numberedFolders: true,
  upperCaseFiles: true,
});
```

## Individual Rule Functions

Use individual rules for custom integrations:

```typescript
import {
  checkBrokenLinks,
  checkHeadingHierarchy,
  checkTodoComments,
  checkCodeBlockLanguage,
} from '@gu-corp/docs-lint';

// Check broken links
const linkIssues = await checkBrokenLinks('./docs', ['README.md', 'guide/API.md']);

// Check heading hierarchy
const headingIssues = await checkHeadingHierarchy('./docs', ['guide/API.md']);
```

## AI Prompt Generation

Generate AI-friendly assessment prompts:

```typescript
import { generateAIPrompt, generateJSONSummary } from '@gu-corp/docs-lint';

const prompt = generateAIPrompt(docsDir, files, lintResult, config);
console.log(prompt);

const json = generateJSONSummary(docsDir, files, lintResult);
console.log(JSON.stringify(json, null, 2));
```

## Types

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

## Related Documents

- [Configuration](CONFIGURATION.md)
- [Rules Reference](RULES.md)
- [CLI Reference](CLI.md)
