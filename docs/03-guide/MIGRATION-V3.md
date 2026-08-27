# v2 から v3 への移行

## 方針

v3 は破壊的変更であり、v2 の CLI/API alias を提供しない。v2 設定を検出した場合は停止する。自動変換は元ファイルを書き換えず、レビュー用の別ファイルを生成する。

```bash
npx docs-lint migrate \
  --from docs-lint.config.json \
  --to docs-lint.v3.config.json
```

## 主な変更

| v2 | v3 |
| --- | --- |
| version field なし | `schemaVersion: 3` が必須 |
| `docsDir` | `root` |
| severity `warn` | `warning` |
| `brokenLinks` | `links/internal` |
| `headingHierarchy` | `markdown/headings` |
| `codeBlockLanguage` | `markdown/code-fence-language` |
| hardcoded G.U. structure | `standard.pack` と `profile` |
| inline TypeScript templates | Standard Pack の Markdown templates |
| 巨大な CLI と rule switch | command modules と rule registry |
| Anthropic SDK を core dependency に含む | v3 core に AI provider dependency なし |
| `createLinter()` | `loadConfig()` + `lintWorkspace()` または `DocsLintEngine` |

## 削除した機能

v2 の `check code`、`review code/spec`、`show standards/config/rules`、`--ai-prompt`、`--fix` は v3.0 に引き継いでいない。必要性と安全な境界を再定義してから、別 adapter または独立 rule として追加する。

## 移行手順

1. v2 の CI を維持したまま `docs-lint migrate` を実行する。
2. Standard Pack と profile を選び、生成された設定をレビューする。
3. `docs-lint lint --json` で既存文書の gap を保存する。
4. error を解消し、v3 の CI を追加する。
5. v2 job を削除する。

v2 の設定ファイルをそのまま v3 用として編集しない。差分レビューと rollback のため、移行中は両方を保持する。
