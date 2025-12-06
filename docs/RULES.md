# Rules Reference

**Version**: 1.0.0
**Updated**: 2025-12-07

---

## Overview

docs-lint includes the following built-in rules. Each rule can be set to `"off"`, `"warn"`, or `"error"`.

## Available Rules

### brokenLinks

Detects internal links that don't resolve to existing files.

**Default**: `error`

**Example issue**:
```text
README.md:15 Broken link: ./guide/SETUP.md (file not found)
```

### legacyFileNames

Flags files using deprecated naming patterns (e.g., `00-PROPOSAL.md`).

**Default**: `error`

**Example issue**:
```text
01-plan/00-PROPOSAL.md Legacy file name pattern detected
  → Rename to PROPOSAL.md
```

### versionInfo

Ensures documents have version information.

**Default**: `warn`

**Patterns detected**:
- `**Version**: X.X`
- `**バージョン**: X.X`

**Example issue**:
```text
guide/SETUP.md Missing version information
  → Add **Version**: X.X at document start
```

### relatedDocuments

Validates presence of "Related Documents" section.

**Default**: `warn`

**Section names detected**:
- `## Related Documents`
- `## 関連ドキュメント`

### headingHierarchy

Checks for proper heading structure (H1 → H2 → H3, no skipping).

**Default**: `warn`

**Example issue**:
```text
guide/API.md:45 Heading hierarchy violation: H1 → H4 (skipped H2, H3)
```

### todoComments

Finds unresolved TODO and FIXME comments.

**Default**: `warn`

**Patterns detected**:
- `TODO:`
- `FIXME:`
- `XXX:`

**Example issue**:
```text
README.md:23 Unresolved TODO: add authentication docs
```

### codeBlockLanguage

Ensures code blocks have language specifiers.

**Default**: `warn`

**Example issue**:
```text
guide/SETUP.md:67 Code block without language specifier
  → Add language (e.g., ```typescript, ```bash)
```

### orphanDocuments

Finds documents not referenced from any other document.

**Default**: `warn`

**Example issue**:
```text
guide/OLD-SETUP.md Orphan document (not linked from anywhere)
```

### terminology

Enforces consistent terminology usage.

**Default**: `warn`

**Example issue**:
```text
guide/API.md:34 Inconsistent terminology: "api" → use "API"
```

### bidirectionalRefs

Checks for missing back-references between documents.

**Default**: `off`

**Example issue**:
```text
guide/API.md links to guide/AUTH.md but AUTH.md doesn't link back
```

### requirementsCoverage

Validates that requirement IDs are covered in specification documents.

**Default**: `warn`

Requires `requirementPatterns` configuration.

## Rule Configuration Examples

### Disable a Rule

```json
{
  "rules": {
    "todoComments": "off"
  }
}
```

### Make Warning an Error

```json
{
  "rules": {
    "versionInfo": "error"
  }
}
```

### Advanced Configuration

```json
{
  "rules": {
    "legacyFileNames": {
      "severity": "error",
      "exclude": ["archive/**", "legacy/**"]
    }
  }
}
```

---

## Related Documents

- [Configuration](CONFIGURATION.md)
- [CLI Reference](CLI.md)
- [Getting Started](GETTING-STARTED.md)
