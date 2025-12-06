# CLAUDE.md

This file provides guidance to Claude Code when working with the docs-lint package.

## Package Overview

`@gu-corp/docs-lint` is a documentation consistency and quality linting tool for G.U.Corp projects. It validates markdown documentation structure, terminology consistency, and adherence to organizational standards.

## Development Commands

```bash
npm install          # Install dependencies
npm run build        # Build TypeScript to dist/
npm run dev          # Watch mode for development
npm run lint         # Run ESLint
npm test             # Run Vitest tests
```

## CLI Usage

```bash
# Initialize configuration
docs-lint init                    # Interactive setup wizard
docs-lint init -y                 # Use defaults
docs-lint init-standards          # Generate DOCUMENT_STANDARDS.md

# Linting
docs-lint lint                    # Run all linting rules
docs-lint lint -v                 # Verbose output
docs-lint lint --json             # JSON output
docs-lint lint --ai-prompt        # Generate AI-friendly assessment

# Structure checks
docs-lint check-structure         # Check folder structure
docs-lint check-structure --numbered --upper-case

# Standards
docs-lint show-standards          # Show current standards
```

## Project Architecture

### Source Structure

```
src/
├── cli.ts              # CLI entry point (Commander.js)
├── linter.ts           # Main linter class
├── types.ts            # TypeScript types and default config
├── ai-prompt.ts        # AI prompt generation for assessments
├── rules/
│   ├── structure.ts    # Folder/file structure rules
│   ├── content.ts      # Content quality rules
│   └── terminology.ts  # Terminology consistency rules
└── templates/
    ├── standards.ts    # Default DOCUMENT_STANDARDS.md template
    └── translations/   # i18n translations (ja, en)
templates/
└── 04-development/     # Development standards templates
    ├── GIT-WORKFLOW.md
    ├── CI-CD.md
    ├── CODING-STANDARDS.md (planned)
    └── TESTING.md (planned)
```

### Key Components

- **Linter**: Core linting engine that runs configurable rules
- **Rules**: Modular rule implementations (structure, content, terminology)
- **AI Prompt**: Generates structured prompts for AI-based documentation review
- **Templates**: Embeds G.U.Corp standards for synchronization

## Design Decisions and History

### Background

This package was created to standardize documentation across G.U.Corp's 90+ repositories. The goal is to:
1. Enforce consistent folder structure (numbered folders like `01-overview/`)
2. Ensure terminology consistency across documents
3. Enable AI-assisted documentation review
4. Provide a single source of truth for development standards

### ESM Module System

The package uses ES modules (`"type": "module"`). Key considerations:
- Use `import` statements, not `require()`
- Dynamic imports for config files: `await import(\`file://\${path}\`)`
- File extensions required in imports: `./linter.js`

**Issue #1 Fix**: The CLI had `require()` calls that broke ESM compatibility. Fixed by:
- Moving `readStandardsFile` and `getDefaultStandards` to static imports
- Making `loadConfig` async with dynamic `import()`

### Folder Numbering Configuration

Folder numbering strictness is configurable per path:

```typescript
folderNumbering: {
  severity: 'warn',
  strictPaths: ['', '02-spec'],  // Root and 02-spec require numbering
  checkSequence: true,           // Check for gaps (01, 02, 03...)
}
```

Default behavior:
- Root-level folders must be numbered (`01-`, `02-`, etc.)
- `02-spec/` subfolders must be numbered
- Other subfolders are flexible

### i18n Support

Translations are stored in `src/templates/translations/`:
- `ja/` - Japanese (primary)
- `en/` - English

Standards can be generated in different languages.

### Standards Synchronization (Planned)

The package embeds development standards templates that can be synchronized to projects:

1. **Templates**: Canonical standards stored in `templates/04-development/`
2. **Sync Command**: `docs-lint sync --standards` (planned)
3. **Drift Detection**: Lint rule to detect when project standards differ from templates

This approach ensures:
- AI can read standards from project's own docs
- Engineers have local copies to reference
- Central updates can be pushed via docs-lint upgrades

## Configuration

### docs-lint.config.json

```json
{
  "docsDir": "./docs",
  "include": ["**/*.md"],
  "exclude": ["node_modules/**", "drafts/**"],
  "rules": {
    "folderNumbering": {
      "severity": "warn",
      "strictPaths": ["", "02-spec"],
      "checkSequence": true
    },
    "fileNaming": "warn",
    "requiredSections": "error",
    "terminology": "warn"
  },
  "terminology": [
    { "preferred": "ドキュメント", "variants": ["文書"] }
  ]
}
```

## Testing

Uses Vitest for fast ESM-native testing:

```bash
npm test              # Run all tests
npm test -- --watch   # Watch mode
```

## Release Process

1. Update version in `package.json`
2. Commit and push to main
3. Create tag: `git tag v1.x.x`
4. Push tag: `git push origin --tags`
5. GitHub Actions automatically creates release

## Pending Features

- [ ] `sync` command for standards synchronization
- [ ] `standardsDrift` lint rule to detect differences
- [ ] `--with-standards` option for `init` command
- [ ] Additional templates (CODING-STANDARDS.md, TESTING.md)
