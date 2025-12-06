# @gu-corp/docs-lint

A comprehensive documentation linting tool for validating structure, quality, and consistency of markdown documentation.

## Features

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
- **AI-Friendly Reports**: Generate prompts for AI quality assessment

## Installation

```bash
npm install @gu-corp/docs-lint
```

## CLI Usage

```bash
# Basic linting
npx docs-lint lint

# Specify docs directory
npx docs-lint lint -d ./documentation

# Output as JSON
npx docs-lint lint --json

# Generate AI assessment prompt
npx docs-lint lint --ai-prompt

# Check folder structure
npx docs-lint check-structure --numbered --upper-case

# Initialize configuration
npx docs-lint init
```

### CLI Options

| Option | Description |
|--------|-------------|
| `-d, --docs-dir <path>` | Documentation directory (default: `./docs`) |
| `-c, --config <path>` | Configuration file path |
| `--only <rules>` | Only run specific rules (comma-separated) |
| `--skip <rules>` | Skip specific rules (comma-separated) |
| `-v, --verbose` | Verbose output |
| `--json` | Output as JSON |
| `--ai-prompt` | Generate AI-friendly assessment prompt |

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
    }
  }
}
```

## AI-Friendly Output

Generate prompts suitable for AI-based document quality assessment:

```bash
npx docs-lint lint --ai-prompt > quality-report.md
```

This generates a structured markdown report that can be fed to Claude or other AI assistants for detailed quality evaluation.

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

GitHub Actions example:

```yaml
- name: Lint documentation
  run: npm run lint:docs
```

## License

MIT © G.U.Corp
