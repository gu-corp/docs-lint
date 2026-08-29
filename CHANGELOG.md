# Changelog

## Unreleased

- Restored v2 requirement traceability (see `docs/01-plan/V3-RESTORATION.md`, Phase 1): `traceability/requirements-tests` now recognises deferred (`TC-D…`) and excluded (`TC-X…`) test cases, reports requirement documents without IDs, test documents without IDs and missing test documents (`requireRequirementIds`, `requireTestCaseIds`, `requireTestFile`), widens the default requirement/test document globs and ignores identifiers inside code.
- Added `traceability/requirement-ids`, which reports requirement IDs that do not follow the configured pattern (`FR001`, `fr-001`, `FR_001`, …) and IDs defined more than once at table rows or headings.
- Added `traceability/requirement-references`, which reports requirement IDs referenced by other documents that no requirement document defines.
- Rules may emit `info` diagnostics that keep their level instead of being promoted to the configured severity.
- Documented `docs-lint.config.json` inside its JSON Schema: every property carries a Japanese `description` and a Markdown `markdownDescription` with defaults and examples, every built-in rule ID is listed under `rules` with its meaning so editors complete and explain rule names, severities carry per-value descriptions, and two `defaultSnippets` insert starter configurations.
- Anchored `traceability/requirements-tests` diagnostics for untested requirements at the requirement definition (file, line and column, including front matter offset) so editors can open the document instead of a location-less, root-wide report. Root-wide diagnostics such as missing test case IDs or insufficient coverage remain without a file.

## 3.2.0

- Added options-only rule settings so projects can customize rule options without replacing Standard Pack or profile severity.
- Preserved winner-takes-all compatibility for settings with severity, while allowing an options-only winner to inherit profile, Pack or rule-default severity.
- Exposed separate severity and options provenance from Editor sessions and aligned config, Standard Pack schemas and CLI behavior.

## 3.1.1

- Included generated third-party notices and complete license texts for every dependency bundled into the Editor runtime.
- Rejected `lunascape-docs.json`, Standard Pack manifest and template symlinks that resolve outside their allowed workspace or Pack boundary.

## 3.1.0

- Added a filesystem-backed Editor session API for linting, effective-rule provenance, Standard Pack metadata and safe template rendering.
- Added a self-contained Node ESM Editor runtime built with Rolldown and covered by package smoke tests.
- Bounded discovered configuration and local Standard Pack paths to the Editor workspace and rejected unsafe built-in Pack names.

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
