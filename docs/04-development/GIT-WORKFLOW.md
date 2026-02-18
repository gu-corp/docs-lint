# Git ワークフロー規約

**バージョン**: 2.0.0
**更新日**: 2026-02-18

---

## 概要

本文書は、G.U.Corp プロジェクトにおける Git ワークフローの標準規約を定めます。

---

## 1. ブランチ戦略

### 1.1 環境ブランチ

環境に紐づく保護されたブランチ:

| ブランチ | 環境 | 用途 | 保護 |
|----------|------|------|------|
| `main` | Production | 本番環境 | 必須（承認必須） |
| `stage` | Staging | ステージング・本番前検証 | 必須 |
| `test` | Test | QA・検証用 | 推奨 |
| `dev` | Development | 開発環境 | 推奨 |

```text
環境ブランチの流れ:

dev → test → stage → main
 │      │       │       │
 ▼      ▼       ▼       ▼
Dev   Test   Staging  Prod
環境    環境     環境    環境
```

### 1.2 作業ブランチ

| プレフィックス | 用途 | マージ先 | 例 |
|----------------|------|---------|-----|
| `feature/` | 新機能 | dev | `feature/user-auth` |
| `fix/` | バグ修正 | dev | `fix/login-error` |
| `hotfix/` | 緊急修正 | main (直接) | `hotfix/security-patch` |
| `refactor/` | リファクタリング | dev | `refactor/api-client` |
| `docs/` | ドキュメント | dev | `docs/api-reference` |
| `develop/` | メジャーバージョン開発 | dev (完成時) | `develop/v2` |

### 1.3 開発フロー

```text
dev ─────────────────────────────────────────────────────►
  │
  ├─ feature/user-auth ──┐
  │                       │ PR to dev
  │  ┌────────────────────┘
  │  │ (Review & CI)
  ├──┴─ (Merge to dev)
  │
  ├─────────────────────────────► test (PR/Merge)
  │
  ├─────────────────────────────► stage (PR/Merge)
  │
  └─────────────────────────────► main (PR/Merge + Approval)
```

### 1.4 メジャーバージョン開発

大規模な破壊的変更を伴う場合:

```text
develop/v2 ─────────────────────────────────────────►
  │
  ├─ feature/v2-new-api ──┐
  │                        │ PR to develop/v2
  │  ┌─────────────────────┘
  ├──┴─ (Merge)
  │
  └─────────────────────────► dev (リリース時にマージ)
```

### 1.5 命名規則

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

### 4.2 タグとブランチの対応

| ブランチ | 環境 | タグ | マージ時の必須タグ |
|---------|------|------|-------------------|
| dev | Development | build.N (自動), alpha.N (任意) | - |
| test | Test/QA | beta.N (手動) | beta |
| stage | Staging | rc.N (手動) | rc |
| main | Production | vX.Y.Z (手動) | release |

```text
リリースフロー:

feature/* ──► dev ──[beta]──► test ──[rc]──► stage ──[vX.Y.Z]──► main
              │                │               │                  │
         build.N/alpha.N    beta.N           rc.N             release
           (自動/任意)       (手動)          (手動)            (手動)
```

### 4.3 タグの意味

| タグ | 意味 | 作成タイミング |
|------|------|---------------|
| build.N | CI/CD ビルド識別子 | dev push 時に自動 |
| alpha.N | 開発中マイルストーン | dev で任意に手動 |
| beta.N | テスト環境へ移行OK | dev → test マージ前に手動 |
| rc.N | ステージング環境へ移行OK | test → stage マージ前に手動 |
| vX.Y.Z | 本番リリース | stage → main マージ前に手動 |

### 4.4 タグ作成コマンド

```bash
# alpha タグ（dev で任意）
git tag -a v2.0.0-alpha.1 -m "v2.0.0 Alpha 1"
git push origin v2.0.0-alpha.1

# beta タグ（test 環境へのマージ前）
git tag -a v2.0.0-beta.1 -m "v2.0.0 Beta 1"
git push origin v2.0.0-beta.1

# rc タグ（stage 環境へのマージ前）
git tag -a v2.0.0-rc.1 -m "v2.0.0 Release Candidate 1"
git push origin v2.0.0-rc.1

# 本番リリースタグ（main へのマージ前）
git tag -a v2.0.0 -m "Release v2.0.0"
git push origin v2.0.0
```

### 4.5 GitHub Release

本番リリース時は GitHub Release を作成:

```bash
gh release create v2.0.0 --title "v2.0.0" --notes "Release notes here"
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
