# 統合要件

**バージョン**: 2.0.0
**更新日**: 2026-02-18

---

## 概要

docs-lint と外部システムとの統合・連携に関する要件を定義します。

## 統合要件一覧

| ID | 要件 | 優先度 | 実装Ver |
|----|------|--------|---------|
| IR-001 | GitHub Actionsで実行可能 | 高 | v1.0 |
| IR-002 | Anthropic APIと連携してAIレビューを実行できる | 中 | v1.8 |
| IR-003 | pre-commitフックで実行可能 | 低 | v1.0 |

## 詳細

### IR-001: GitHub Actions統合

**目的**: プルリクエスト時に自動でドキュメント品質をチェック

**要件**:

- 終了コード0（成功）/1（失敗）を返す
- ubuntu-latestランナーで動作
- Node.js 18/20/22で動作確認済み

**実装例**:

```yaml
- name: Install docs-lint
  run: npm install github:gu-corp/docs-lint

- name: Run docs-lint
  run: npx docs-lint lint -v
```

### IR-002: Anthropic API連携

**目的**: AIによる高度なドキュメントレビューを実現

**要件**:

- `ANTHROPIC_API_KEY` 環境変数で認証
- `review:spec` コマンドでAIレビュー実行
- `--ai-prompt` でAI向けプロンプト生成

**環境変数**:

```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### IR-003: pre-commit統合

**目的**: コミット前にローカルでドキュメントチェック

**要件**:

- husky等のGitフックツールと連携可能
- 軽量な実行（lint-stagedとの組み合わせ）

**実装例**:

```json
{
  "lint-staged": {
    "docs/**/*.md": "npx docs-lint lint"
  }
}
```

---

## 関連ドキュメント

- [機能要件](../01-functional/REQUIREMENTS.md)
- [CI/CD設定](../../../04-development/CI-CD.md)
