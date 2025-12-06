# Configuration Reference

**Version**: 1.0.0
**Updated**: 2025-12-07

---

## Overview

docs-lint can be configured via a JSON configuration file. This document describes all available options.

## Configuration Files

docs-lint looks for configuration in this order:

1. `docs-lint.config.json`
2. `docs-lint.config.js`
3. `.docs-lintrc.json`

## Basic Configuration

```json
{
  "docsDir": "./docs",
  "include": ["**/*.md"],
  "exclude": ["node_modules/**", "drafts/**"],
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
  }
}
```

## Options Reference

### docsDir

Type: `string`
Default: `"./docs"`

The root directory containing your documentation.

### include

Type: `string[]`
Default: `["**/*.md"]`

Glob patterns for files to include.

### exclude

Type: `string[]`
Default: `["node_modules/**"]`

Glob patterns for files to exclude.

### rules

Type: `object`

Rule severity configuration. Each rule can be:

| Value | Description |
|-------|-------------|
| `"off"` | Disable the rule |
| `"warn"` | Report as warning (CI passes) |
| `"error"` | Report as error (CI fails) |

### terminology

Type: `array`

Define preferred terms and their variants:

```json
{
  "terminology": [
    {
      "preferred": "API",
      "variants": ["api", "Api"]
    },
    {
      "preferred": "user",
      "variants": ["end-user", "enduser"]
    }
  ]
}
```

### requiredFiles

Type: `string[]`

Files that must exist in the docs directory:

```json
{
  "requiredFiles": ["README.md", "CHANGELOG.md"]
}
```

### requirementPatterns

Type: `string[]`

Patterns to identify requirement IDs:

```json
{
  "requirementPatterns": ["REQ-\\d+", "FR-\\d+"]
}
```

## Advanced Rule Configuration

Some rules support extended configuration:

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
      "patterns": ["**Version**:", "**バージョン**:"],
      "include": ["**/spec/**"]
    }
  }
}
```

## Language Configuration

Create `docs/docs.config.json` for multi-language projects:

```json
{
  "commonLanguage": "en",
  "draftLanguages": ["ja", "vi", "en"],
  "teams": {
    "tokyo": "ja",
    "hanoi": "vi",
    "global": "en"
  }
}
```

---

## Related Documents

- [Rules Reference](RULES.md)
- [Getting Started](GETTING-STARTED.md)
- [CLI Reference](CLI.md)
