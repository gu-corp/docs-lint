# Changelog

## 3.0.0

- Replaced the branch-heavy v2 linter with a namespaced rule registry and stable diagnostic report.
- Added versioned Document Standard Packs with profile inheritance, required documents, sections, terminology and safe Markdown templates.
- Added the `gu-corp/software-standard` Pack for requirements, architecture and test documentation.
- Split pure rules, Standard Pack contracts, Node filesystem adapters and CLI commands into explicit layers.
- Added strict v3 configuration, JSON Schemas and shared `lunascape-docs.json.documentStandards` selection.
- Added safe document creation with traversal, symlink escape and implicit overwrite protection.
- Removed the Anthropic SDK, hardcoded organization rules, v2 compatibility aliases and retired commands from the runtime.
- Added migration output, type checks, 13 automated tests, built CLI smoke tests, self lint and dependency audit gates.

v3 is intentionally incompatible with v2. See `docs/03-guide/MIGRATION-V3.md`.
