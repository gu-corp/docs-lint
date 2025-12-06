# docs-lint Documentation

**Version**: 1.0.0
**Updated**: 2025-12-07

---

## Overview

docs-lint is a comprehensive documentation linting tool for validating structure, quality, and consistency of markdown documentation. It provides automated checks and AI-friendly output for quality assessment.

## Documentation Structure

```text
docs/
├── README.md                 # This file - documentation index
├── GETTING-STARTED.md        # Quick start guide
├── CONFIGURATION.md          # Configuration reference
├── RULES.md                  # Available lint rules
├── CLI.md                    # CLI reference
├── API.md                    # Programmatic API
├── GITHUB-ACTIONS.md         # CI/CD integration
└── DOCUMENT_STANDARDS.md     # G.U.Corp document standards
```

## Quick Links

- [Getting Started](GETTING-STARTED.md) - Installation and first run
- [Configuration](CONFIGURATION.md) - Config file options
- [Rules Reference](RULES.md) - All available lint rules
- [CLI Reference](CLI.md) - Command-line options
- [API Reference](API.md) - Programmatic usage
- [GitHub Actions](GITHUB-ACTIONS.md) - CI/CD setup

## Features

| Feature | Description |
|---------|-------------|
| Broken Link Detection | Find internal links that don't resolve |
| Legacy File Detection | Flag deprecated naming patterns |
| Version Validation | Ensure docs have version info |
| Heading Hierarchy | Check proper H1 → H2 → H3 structure |
| TODO Detection | Find unresolved TODO/FIXME comments |
| Code Block Language | Ensure language specifiers |
| Orphan Detection | Find unreferenced documents |
| Terminology | Enforce consistent term usage |
| AI-Friendly Output | Generate prompts for AI evaluation |

---

## Related Documents

- [Getting Started](GETTING-STARTED.md)
- [Configuration](CONFIGURATION.md)
- [Rules Reference](RULES.md)
