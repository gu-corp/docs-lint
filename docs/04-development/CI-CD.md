# GitHub Actions 連携

**バージョン**: 1.0
**更新日**: 2025-12-10

---

## 概要

docs-lint を GitHub Actions CI/CD パイプラインに統合する方法を説明します。

## 基本ワークフロー

`.github/workflows/docs-lint.yml` を作成：

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

## ワークフロー機能

### パスフィルタリング

ドキュメントファイルの変更時のみ実行：

```yaml
on:
  push:
    paths:
      - 'docs/**'
      - 'docs-lint.config.json'
```

### 手動トリガー

`workflow_dispatch` で GitHub UI から手動実行可能。

### 失敗時のアーティファクト

リントが失敗した場合、AI向けレポートをアーティファクトとしてアップロード：

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

## 高度なワークフロー

### PRコメント

リント結果をPRにコメント：

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

### キャッシュ

npmパッケージのキャッシュ：

```yaml
- name: Cache node modules
  uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}

- name: Install docs-lint
  run: npm install github:gu-corp/docs-lint
```

### スケジュール実行

定期実行：

```yaml
on:
  schedule:
    - cron: '0 9 * * 1'  # 毎週月曜 9:00 UTC
  workflow_dispatch:
```

## モノレポ設定

複数のドキュメントディレクトリがある場合：

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

## ステータスバッジ

READMEにステータスバッジを追加：

```markdown
![Docs Lint](https://github.com/gu-corp/your-repo/actions/workflows/docs-lint.yml/badge.svg)
```

---

## 関連ドキュメント

- [CLIリファレンス](../03-guide/CLI.md)
- [設定リファレンス](../03-guide/CONFIGURATION.md)
- [はじめに](../03-guide/GETTING-STARTED.md)
