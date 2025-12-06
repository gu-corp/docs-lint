# Getting Started

**Version**: 1.0.0
**Updated**: 2025-12-07

---

## Overview

This guide walks you through installing and running docs-lint for the first time.

## Prerequisites

- Node.js 18 or higher
- npm or yarn

## Installation

### From GitHub (Private)

```bash
npm install github:gu-corp/docs-lint
```

Or add to `package.json`:

```json
{
  "devDependencies": {
    "@gu-corp/docs-lint": "github:gu-corp/docs-lint"
  }
}
```

## Quick Start

### 1. Initialize Configuration

Run the interactive wizard:

```bash
npx docs-lint init
```

This creates:
- `docs-lint.config.json` - Lint rules configuration
- `docs/docs.config.json` - Language settings

### 2. Create Document Standards (Optional)

Generate a standards template:

```bash
npx docs-lint init-standards
```

This creates `docs/DOCUMENT_STANDARDS.md` which defines your documentation quality criteria.

### 3. Run Linting

```bash
npx docs-lint lint
```

For verbose output:

```bash
npx docs-lint lint -v
```

## Example Output

```text
📄 Documentation Lint Results

Files checked: 15
Status: PASSED

Summary:
  Errors: 0
  Warnings: 3
  Passed: 8

✓ brokenLinks
✓ legacyFileNames
✓ versionInfo
⚠ todoComments (2 issues)
    README.md:45 Unresolved TODO: add examples
    guide/SETUP.md:12 Unresolved FIXME: update for v2
✓ codeBlockLanguage
```

## Next Steps

- [Configure rules](CONFIGURATION.md)
- [Understand all rules](RULES.md)
- [Set up CI/CD](GITHUB-ACTIONS.md)

---

## Related Documents

- [Configuration](CONFIGURATION.md)
- [Rules Reference](RULES.md)
- [CLI Reference](CLI.md)
