# @gu-corp/docs-lint

A comprehensive documentation linting tool for validating structure, quality, and consistency of markdown documentation.

## Features

### Documentation Linting
- **Broken Link Detection**: Find and report broken internal links
- **Legacy File Name Detection**: Flag deprecated file naming patterns
- **Version Info Validation**: Ensure documents have version information
- **Related Documents Check**: Validate presence of related documents sections
- **Heading Hierarchy**: Check for proper heading structure (h1 → h2 → h3)
- **TODO/FIXME Detection**: Find unresolved TODO comments
- **Code Block Language**: Ensure code blocks have language specifiers
- **Orphan Document Detection**: Find documents not referenced anywhere
- **Terminology Consistency**: Enforce consistent terminology usage
- **Bidirectional References**: Check for missing back-references
- **Folder Structure Validation**: Verify expected folder organization
- **Standard Folder Structure (v1.7.0)**: Enforce G.U.Corp standard structure (01-plan, 02-spec, etc.)
- **Requirement-Test Mapping (v1.4.0)**: Validate FR-XXX requirements have corresponding TC-XXX test cases
- **Document Standards**: Built-in G.U.Corp document standards with project-level customization
- **Markdown Lint (v1.14.0)**: Integrated markdownlint for formatting/syntax checks with auto-fix support

### Code Review (v1.2.0+)
- **Test File Existence**: Check if source files have corresponding test files
- **Test Coverage Analysis**: Analyze unit/integration/E2E test coverage
- **Critical Path E2E**: Ensure critical paths have E2E tests
- **AI Requirement Coverage**: AI-powered analysis of requirement implementation
- **AI Spec Review**: AI-powered specification consistency and terminology check

## Installation

このパッケージはnpm registryには公開されていません。GitHubリポジトリから直接インストールしてください。

```bash
# Install from GitHub (recommended)
npm install github:gu-corp/docs-lint --save-dev

# Or add to package.json manually
# "devDependencies": {
#   "@gu-corp/docs-lint": "github:gu-corp/docs-lint"
# }

# Install specific version
npm install github:gu-corp/docs-lint#v1.14.1 --save-dev
```

> ⚠️ **Important**:
> - このパッケージはGitHub npm registryやnpmjs.comには公開されていません
> - `github:gu-corp/docs-lint` の形式でインストールしてください
> - 常にローカルのdevDependencyとしてインストールし、グローバルインストールは避けてください

## CLI Usage

```bash
# Basic linting
docs-lint lint

# Auto-fix markdown formatting issues (v1.14.0)
docs-lint lint --fix

# Specify docs directory
docs-lint lint -d ./documentation

# Output as JSON
docs-lint lint --json

# Generate AI assessment prompt
docs-lint lint --ai-prompt

# Check folder structure
docs-lint check-structure --numbered --upper-case

# Initialize configuration
docs-lint init

# Create standard folder structure (v1.7.0)
docs-lint scaffold -d ./docs
docs-lint scaffold -d ./docs --with-templates  # Include template files
docs-lint scaffold -d ./docs --dry-run         # Preview without creating
```

### Code Review Commands (v1.2.0+)

```bash
# Static code checks (test file existence, coverage)
docs-lint check:code -s ./src

# Static specification checks (structure, references)
docs-lint check:spec -d ./docs

# AI-powered requirement coverage analysis (requires ANTHROPIC_API_KEY)
docs-lint review:code -d ./docs -s ./src

# AI-powered spec review (requires ANTHROPIC_API_KEY)
docs-lint review:spec -d ./docs
```

#### Environment Variables for AI Commands

```bash
# Set in .env file or export
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### CLI Options

| Option | Description |
|--------|-------------|
| `-d, --docs-dir <path>` | Documentation directory (default: `./docs`) |
| `-s, --src-dir <path>` | Source directory (default: `./src`) |
| `-c, --config <path>` | Configuration file path |
| `--only <rules>` | Only run specific rules (comma-separated) |
| `--skip <rules>` | Skip specific rules (comma-separated) |
| `-v, --verbose` | Verbose output |
| `--json` | Output as JSON |
| `--ai-prompt` | Generate AI-friendly assessment prompt |
| `--fix` | Auto-fix markdown formatting issues (v1.14.0) |

## Programmatic Usage

```typescript
import { createLinter, DocsLintConfig } from '@gu-corp/docs-lint';

const config: Partial<DocsLintConfig> = {
  docsDir: './docs',
  include: ['**/*.md'],
  exclude: ['node_modules/**'],
  rules: {
    brokenLinks: 'error',
    legacyFileNames: 'error',
    versionInfo: 'warn',
    relatedDocuments: 'warn',
    headingHierarchy: 'warn',
    todoComments: 'warn',
    codeBlockLanguage: 'warn',
    orphanDocuments: 'warn',
    terminology: 'warn',
    bidirectionalRefs: 'off',
    requirementsCoverage: 'warn',
  },
  terminology: [
    {
      preferred: 'ドキュメント',
      variants: ['文書', 'ドキュメンテーション'],
    },
  ],
  requiredFiles: ['README.md'],
};

const linter = createLinter(config);
const result = await linter.lint();

console.log(`Passed: ${result.passed}`);
console.log(`Errors: ${result.summary.errors}`);
console.log(`Warnings: ${result.summary.warnings}`);
```

## Configuration

Create a `docs-lint.config.json` file in your project root:

```json
{
  "docsDir": "./docs",
  "include": ["**/*.md"],
  "exclude": ["node_modules/**", "**/archive/**"],
  "rules": {
    "brokenLinks": "error",
    "legacyFileNames": "error",
    "versionInfo": "warn",
    "relatedDocuments": "warn",
    "headingHierarchy": "warn",
    "todoComments": "warn",
    "codeBlockLanguage": "warn",
    "orphanDocuments": "warn",
    "terminology": "warn",
    "bidirectionalRefs": "off",
    "requirementsCoverage": "warn"
  },
  "terminology": [
    {
      "preferred": "API",
      "variants": ["api", "Api"]
    }
  ],
  "requiredFiles": ["README.md", "CHANGELOG.md"]
}
```

### Rule Severity

Each rule can be set to:
- `"off"`: Disable the rule
- `"warn"`: Report as warning (doesn't fail CI)
- `"error"`: Report as error (fails CI)

### Advanced Rule Configuration

Some rules support advanced configuration:

```json
{
  "rules": {
    "legacyFileNames": {
      "severity": "error",
      "pattern": "\\d{2}-[A-Z][A-Z0-9-]+\\.md",
      "exclude": ["archive/**"]
    },
    "versionInfo": {
      "severity": "warn",
      "patterns": ["**バージョン**:", "**Version**:"],
      "include": ["**/spec/**"]
    },
    "markdownLint": {
      "severity": "warn",
      "rules": {
        "MD013": false,
        "MD033": false
      }
    },
    "todoComments": {
      "severity": "warn",
      "tags": {
        "TODO": { "severity": "info", "message": "実装予定" },
        "FIXME": { "severity": "warn", "message": "要修正" },
        "BUG": { "severity": "error", "message": "バグ" },
        "NOTE": { "severity": "off" }
      },
      "ignoreInlineCode": true,
      "ignoreCodeBlocks": true
    }
  }
}
```

### TODO Comments Configuration (v1.15.0)

The `todoComments` rule now supports tag-specific severity levels:

| Tag | Default Severity | Description |
|-----|------------------|-------------|
| `TODO` | info | 実装予定のタスク |
| `FIXME` | warn | 要修正の問題 |
| `XXX` | warn | 要注意箇所 |
| `HACK` | warn | 回避策・一時実装 |
| `BUG` | error | 既知のバグ |
| `NOTE` | off | 補足説明（デフォルト無視） |
| `REVIEW` | info | レビュー対象 |
| `OPTIMIZE` | info | 最適化候補 |
| `WARNING` | warn | 警告 |
| `QUESTION` | info | 要確認 |

Options:
- `ignoreInlineCode`: Ignore TODO in \`inline code\` (default: true)
- `ignoreCodeBlocks`: Ignore TODO in code blocks (default: true)
- `ignoreInTables`: Ignore TODO in table cells (default: false)
- `customTags`: Add custom tags to detect
- `excludePatterns`: Regex patterns to exclude

## Standard Folder Structure (v1.7.0)

docs-lint enforces the G.U.Corp standard folder structure:

```text
docs/
├── 01-plan/              # Planning & proposals (required)
├── 02-spec/              # Specifications (required)
│   ├── 01-requirements/  # Requirements (required)
│   ├── 02-architecture/  # Architecture design
│   ├── 03-detail-design/ # Detail design
│   ├── 04-infrastructure/# Infrastructure specs
│   └── 05-testing/       # Test specs (required)
├── 03-guide/             # Guides & manuals (required)
├── 04-development/       # Development standards (required)
├── 05-business/          # Business strategy (optional)
└── 06-reference/         # Reference materials (optional)
```

Use `docs-lint scaffold` to create this structure automatically.

## Requirement-Test Mapping (v1.4.0+)

Validates that all functional requirements have corresponding test cases:

### Requirement ID Format

```markdown
| ID | Requirement | Priority | Version |
|----|-------------|----------|---------|
| FR-001 | User can login | High | v1 |
| FR-AUTH-001 | Two-factor auth | Medium | v2 |
| FR-AUTH-LOGIN-001 | SSO login | Low | - |
```

Supported formats: `FR-XXX`, `FR-CATEGORY-XXX`, `FR-CAT-SUB-XXX`

### Test Case ID Format

```markdown
| ID | Requirement | Description | Expected |
|----|-------------|-------------|----------|
| TC-U001 | FR-001 | Valid login test | Success |
| TC-D001 | FR-AUTH-001 | Deferred to v2 | - |
| TC-X001 | FR-EXT-001 | Out of scope | - |
```

| Prefix | Category | Description |
|--------|----------|-------------|
| TC-U | Unit | Unit tests |
| TC-I | Integration | Integration tests |
| TC-E | E2E | End-to-end tests |
| TC-P | Performance | Performance tests |
| TC-S | Security | Security tests |
| TC-D | Deferred | Deferred to future version |
| TC-X | Excluded | Out of scope |

## Document Standards

docs-lint includes built-in G.U.Corp document standards. If your project has a `DOCUMENT_STANDARDS.md` file, it will be used instead.

### View Current Standards

```bash
# Show which standards are being used
npx docs-lint show-standards
```

### Create Project-Specific Standards

```bash
# Generate DOCUMENT_STANDARDS.md from default template
npx docs-lint init-standards

# Overwrite existing file
npx docs-lint init-standards --force
```

### How Standards Work

1. **Project-specific**: If `docs/DOCUMENT_STANDARDS.md` exists, it's used
2. **Default fallback**: Otherwise, G.U.Corp default standards are applied
3. **AI Prompt**: When using `--ai-prompt`, standards are included with instructions for AI to read them first

Supported file names:

- `DOCUMENT_STANDARDS.md`
- `DOCUMENT-STANDARDS.md`
- `DOC_STANDARDS.md`
- `STANDARDS.md`

## AI-Friendly Output

Generate prompts suitable for AI-based document quality assessment:

```bash
npx docs-lint lint --ai-prompt > quality-report.md
```

This generates a structured markdown report that includes:

1. **AI Instructions**: Guidance for the AI on how to evaluate
2. **Document Standards**: The evaluation criteria (project-specific or G.U.Corp default)
3. **Lint Results**: Automated check results
4. **Quality Metrics**: Checklist for manual evaluation

The report can be fed to Claude or other AI assistants for detailed quality evaluation.

## Folder Structure Validation

Check that your documentation follows expected folder structure:

```typescript
import { createLinter } from '@gu-corp/docs-lint';

const linter = createLinter({ docsDir: './docs' });

const results = await linter.lintStructure({
  folders: [
    { path: '01-plan', required: true, description: 'Planning documents' },
    { path: '02-spec', required: true, description: 'Specifications' },
    { path: '03-guide', required: false, description: 'User guides' },
  ],
  numberedFolders: true,
  upperCaseFiles: true,
});
```

## Individual Rule Functions

Use individual rule functions for custom integrations:

```typescript
import {
  checkBrokenLinks,
  checkHeadingHierarchy,
  checkTodoComments,
} from '@gu-corp/docs-lint';

const issues = await checkBrokenLinks('./docs', ['README.md', 'guide/intro.md']);
```

## Integration with CI/CD

Add to your `package.json`:

```json
{
  "scripts": {
    "lint:docs": "docs-lint lint",
    "lint:docs:ci": "docs-lint lint --json > docs-lint-report.json"
  }
}
```

### GitHub Actions

Create `.github/workflows/docs-lint.yml`:

```yaml
name: Docs Lint

on:
  push:
    paths:
      - 'docs/**'
      - 'docs-lint.config.json'
  pull_request:
    paths:
      - 'docs/**'
      - 'docs-lint.config.json'
  workflow_dispatch:

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install docs-lint
        run: npm install github:gu-corp/docs-lint

      - name: Run docs-lint
        run: npx docs-lint lint -v

      - name: Generate AI prompt (on failure)
        if: failure()
        run: npx docs-lint lint --ai-prompt > docs-lint-report.md

      - name: Upload report
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: docs-lint-report
          path: docs-lint-report.md
```

This workflow:

- Runs on docs changes only
- Generates AI-friendly report on failure
- Uploads report as artifact for debugging

## License

MIT © G.U.Corp
