# GitHub Actions Integration

**Version**: 1.0.0
**Updated**: 2025-12-07

---

## Overview

This guide explains how to integrate docs-lint into your GitHub Actions CI/CD pipeline.

## Basic Workflow

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

## Workflow Features

### Path Filtering

The workflow only runs when documentation files change:

```yaml
on:
  push:
    paths:
      - 'docs/**'
      - 'docs-lint.config.json'
```

### Manual Trigger

`workflow_dispatch` allows manual triggering from GitHub UI.

### Failure Artifacts

When linting fails, an AI-friendly report is uploaded as an artifact:

```yaml
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

## Advanced Workflows

### With PR Comments

Post lint results as PR comments:

```yaml
- name: Run docs-lint
  id: lint
  run: |
    npx docs-lint lint --json > result.json
    echo "result=$(cat result.json | jq -c)" >> $GITHUB_OUTPUT
  continue-on-error: true

- name: Comment on PR
  if: github.event_name == 'pull_request'
  uses: actions/github-script@v7
  with:
    script: |
      const result = ${{ steps.lint.outputs.result }};
      const body = `## Docs Lint Results

      - **Files**: ${result.summary.totalFiles}
      - **Errors**: ${result.summary.errors}
      - **Warnings**: ${result.summary.warnings}
      - **Status**: ${result.summary.passed ? '✅ Passed' : '❌ Failed'}
      `;

      github.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.issue.number,
        body
      });
```

### With Caching

Cache npm dependencies for faster runs:

```yaml
- name: Cache node modules
  uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}

- name: Install docs-lint
  run: npm install github:gu-corp/docs-lint
```

### Scheduled Runs

Run docs-lint on a schedule:

```yaml
on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9:00 UTC
  workflow_dispatch:
```

## Monorepo Setup

For monorepos with multiple docs directories:

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        docs-dir:
          - packages/app/docs
          - packages/sdk/docs
          - docs
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install docs-lint
        run: npm install github:gu-corp/docs-lint

      - name: Run docs-lint
        run: npx docs-lint lint -d ${{ matrix.docs-dir }} -v
```

## Status Badge

Add a status badge to your README:

```markdown
![Docs Lint](https://github.com/gu-corp/your-repo/actions/workflows/docs-lint.yml/badge.svg)
```

---

## Related Documents

- [CLI Reference](CLI.md)
- [Configuration](CONFIGURATION.md)
- [Getting Started](GETTING-STARTED.md)
