# CLI Reference

**Version**: 1.0.0
**Updated**: 2025-12-07

---

## Overview

docs-lint provides a command-line interface for linting documentation.

## Commands

### lint

Run documentation linting.

```bash
npx docs-lint lint [options]
```

**Options**:

| Option | Description |
|--------|-------------|
| `-d, --docs-dir <path>` | Documentation directory (default: `./docs`) |
| `-c, --config <path>` | Configuration file path |
| `--only <rules>` | Only run specific rules (comma-separated) |
| `--skip <rules>` | Skip specific rules (comma-separated) |
| `-v, --verbose` | Verbose output |
| `--json` | Output as JSON |
| `--ai-prompt` | Generate AI-friendly assessment prompt |

**Examples**:

```bash
# Basic linting
npx docs-lint lint

# Specify docs directory
npx docs-lint lint -d ./documentation

# Verbose output
npx docs-lint lint -v

# Only run specific rules
npx docs-lint lint --only brokenLinks,todoComments

# Skip specific rules
npx docs-lint lint --skip terminology,orphanDocuments

# Output as JSON
npx docs-lint lint --json

# Generate AI prompt
npx docs-lint lint --ai-prompt > report.md
```

### init

Initialize configuration with interactive wizard.

```bash
npx docs-lint init [options]
```

**Options**:

| Option | Description |
|--------|-------------|
| `-d, --docs-dir <path>` | Documentation directory (default: `./docs`) |
| `-y, --yes` | Skip wizard, use defaults |

**Examples**:

```bash
# Interactive setup
npx docs-lint init

# Use defaults (no prompts)
npx docs-lint init -y
```

### init-standards

Generate DOCUMENT_STANDARDS.md from G.U.Corp template.

```bash
npx docs-lint init-standards [options]
```

**Options**:

| Option | Description |
|--------|-------------|
| `-d, --docs-dir <path>` | Documentation directory (default: `./docs`) |
| `-f, --force` | Overwrite existing file |

**Examples**:

```bash
# Create standards file
npx docs-lint init-standards

# Overwrite existing
npx docs-lint init-standards --force
```

### show-standards

Display current document standards.

```bash
npx docs-lint show-standards [options]
```

**Options**:

| Option | Description |
|--------|-------------|
| `-d, --docs-dir <path>` | Documentation directory (default: `./docs`) |

### check-structure

Check folder structure and naming conventions.

```bash
npx docs-lint check-structure [options]
```

**Options**:

| Option | Description |
|--------|-------------|
| `-d, --docs-dir <path>` | Documentation directory (default: `./docs`) |
| `--numbered` | Expect numbered folders (01-, 02-, etc.) |
| `--upper-case` | Expect UPPER_CASE.md file names |

**Examples**:

```bash
# Check structure with numbered folders
npx docs-lint check-structure --numbered

# Check for uppercase file names
npx docs-lint check-structure --upper-case

# Both checks
npx docs-lint check-structure --numbered --upper-case
```

## Exit Codes

| Code | Description |
|------|-------------|
| `0` | All checks passed |
| `1` | One or more errors found |

## Output Formats

### Human-Readable (Default)

```text
📄 Documentation Lint Results

Files checked: 15
Status: PASSED

Summary:
  Errors: 0
  Warnings: 3
  Passed: 8

✓ brokenLinks
⚠ todoComments (2 issues)
    README.md:45 Unresolved TODO: add examples
```

### JSON (`--json`)

```json
{
  "meta": {
    "generatedAt": "2025-12-07T00:00:00.000Z",
    "tool": "@gu-corp/docs-lint"
  },
  "summary": {
    "totalFiles": 15,
    "errors": 0,
    "warnings": 3,
    "passed": true
  },
  "issues": [...]
}
```

### AI Prompt (`--ai-prompt`)

Generates structured markdown for AI evaluation, including:
- Document standards
- Lint results
- Quality metrics checklist

---

## Related Documents

- [Configuration](CONFIGURATION.md)
- [Rules Reference](RULES.md)
- [GitHub Actions](GITHUB-ACTIONS.md)
