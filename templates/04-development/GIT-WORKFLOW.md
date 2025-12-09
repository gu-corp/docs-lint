# Git ワークフロー規約

**バージョン**: 1.0
**更新日**: 2025-12-07

---

## 概要

本文書は、G.U.Corp プロジェクトにおける Git ワークフローの標準規約を定めます。

---

## 1. ブランチ戦略

### 1.1 メインブランチ

| ブランチ | 用途 | 保護 |
|----------|------|------|
| `main` | 本番環境 | 必須 |
| `develop` | 開発統合（オプション） | 推奨 |

### 1.2 作業ブランチ

| プレフィックス | 用途 | 例 |
|----------------|------|-----|
| `feature/` | 新機能 | `feature/user-auth` |
| `fix/` | バグ修正 | `fix/login-error` |
| `hotfix/` | 緊急修正 | `hotfix/security-patch` |
| `refactor/` | リファクタリング | `refactor/api-client` |
| `docs/` | ドキュメント | `docs/api-reference` |

### 1.3 命名規則

```text
{type}/{short-description}
```

- 小文字とハイフンのみ使用
- 50文字以内
- Issue番号を含める場合: `feature/123-user-auth`

---

## 2. コミット規約

### 2.1 コミットメッセージ形式

```text
{type}: {subject}

{body}

{footer}
```

### 2.2 Type一覧

| Type | 説明 |
|------|------|
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `docs` | ドキュメント |
| `style` | フォーマット（コード変更なし） |
| `refactor` | リファクタリング |
| `test` | テスト追加・修正 |
| `chore` | ビルド・補助ツール |

### 2.3 例

```text
feat: Add user authentication

- Implement JWT-based authentication
- Add login/logout endpoints
- Create auth middleware

Closes #123
```

---

## 3. プルリクエスト

### 3.1 PRテンプレート

```markdown
## Summary
- 変更の概要

## Changes
- 具体的な変更点

## Test Plan
- [ ] テスト項目

## Related Issues
- Closes #123
```

### 3.2 レビュー要件

| 項目 | 要件 |
|------|------|
| 承認数 | 最低1名 |
| CI | 全てパス必須 |
| コンフリクト | 解消必須 |

---

## 4. タグ・リリース

### 4.1 バージョニング

セマンティックバージョニング（SemVer）を使用:

```text
v{MAJOR}.{MINOR}.{PATCH}[-{prerelease}]
```

| 種別 | 変更時 | 例 |
|------|--------|-----|
| MAJOR | 破壊的変更 | v2.0.0 |
| MINOR | 機能追加 | v1.1.0 |
| PATCH | バグ修正 | v1.0.1 |
| prerelease | プレリリース | v1.0.0-beta.1 |

### 4.2 リリースフロー

```bash
# バージョン更新
npm version patch  # or minor, major

# タグ作成・プッシュ
git push origin main --tags
```

---

## 5. コミット前チェックリスト

### 5.1 必須確認事項

コミット前に以下を確認してください：

```bash
# 1. 変更内容の確認
git diff --staged

# 2. テスト実行
npm test

# 3. リント実行
npm run lint

# 4. 型チェック
npm run typecheck  # TypeScriptプロジェクトの場合

# 5. ビルド確認
npm run build
```

### 5.2 機能追加・変更時の追加確認

新機能追加やCLI変更時は、以下も確認：

| 確認項目 | 対象ファイル |
|----------|-------------|
| 機能説明を追加 | README.md の Features セクション |
| コマンド/オプション説明を追加 | README.md の CLI Usage セクション |
| オプション一覧を更新 | README.md の CLI Options テーブル |
| 設定例を追加（必要に応じて） | README.md の Configuration セクション |
| 開発者向け説明を更新 | CLAUDE.md または CONTRIBUTING.md |
| CLIヘルプ表示を確認 | `./dist/cli.js --help` |

### 5.3 AI向け指示

AIアシスタントは、機能追加後のコミット時に以下を自動で確認してください：

1. 新しいCLIオプションがREADME.mdに記載されているか
2. 新しい機能がFeaturesセクションに記載されているか
3. 設定変更がある場合、設定例が更新されているか

### 5.4 lint警告の効率的な解決

**AIへの指示**: `docs-lint lint` で警告やエラーが出た場合：

1. **まず `--fix` を試す**

   ```bash
   docs-lint lint --fix
   ```

   自動修正可能な問題（Markdownフォーマット等）はこれで解決できます。

2. **残った問題を手動修正**
   `--fix` で解決できない問題のみ手動で対応してください。

この順序で対応することで、効率的に問題を解決できます。

---

## 6. 禁止事項

- `main` への直接プッシュ
- Force push（`--force`）を共有ブランチに
- 未レビューのマージ
- 大きすぎるPR（500行以上は分割を検討）

---

## 関連ドキュメント

- [コーディング規約](CODING-STANDARDS.md)
- [CI/CD規約](CI-CD.md)
- [テスト規約](TESTING.md)
