# エラー処理設計

**バージョン**: 1.0
**更新日**: 2025-12-10

---

## 概要

docs-lint のエラー処理方針を定義します。

## エラー分類

| 分類 | 説明 | 対応 |
|------|------|------|
| ユーザーエラー | 設定ミス、ファイルなし | 明確なエラーメッセージで案内 |
| リントエラー | ドキュメントの問題 | 問題箇所と修正案を表示 |
| システムエラー | ファイルIO、予期しないエラー | スタックトレースをログ |

## 終了コード

| コード | 意味 | 条件 |
|--------|------|------|
| 0 | 成功 | エラーなし（警告は許容） |
| 1 | 失敗 | 1つ以上のエラー検出 |
| 2 | 設定エラー | 設定ファイルが不正 |

## エラーメッセージ形式

### リントエラー

```text
✗ ruleName (N issues)
    file.md:line message
      → suggestion
```

例：

```text
✗ brokenLinks (2 issues)
    README.md:15 Broken link: ./guide/SETUP.md (file not found)
      → Check file path or create the missing file
    guide/API.md:42 Broken link: ../CHANGELOG.md (file not found)
      → Check file path or create the missing file
```

### 設定エラー

```text
Error: Configuration error
  → Invalid rule name: "unknownRule"
  → Available rules: brokenLinks, legacyFileNames, ...
```

### ファイルエラー

```text
Error: Cannot read docs directory
  → Directory not found: ./documentation
  → Run "docs-lint init" to create initial structure
```

## エラーハンドリング実装

### CLI層

```typescript
// src/cli.ts
try {
  const result = await linter.lint();
  process.exit(result.passed ? 0 : 1);
} catch (error) {
  if (error instanceof ConfigError) {
    console.error(chalk.red(`Error: ${error.message}`));
    console.error(chalk.gray(`  → ${error.suggestion}`));
    process.exit(2);
  }
  // 予期しないエラー
  console.error(chalk.red('Unexpected error:'));
  console.error(error);
  process.exit(1);
}
```

### ルール層

```typescript
// 各ルールでのエラーハンドリング
export async function checkBrokenLinks(
  docsDir: string,
  files: string[]
): Promise<Issue[]> {
  const issues: Issue[] = [];

  for (const file of files) {
    try {
      const content = await fs.readFile(path.join(docsDir, file), 'utf-8');
      // リンクチェック処理
    } catch (error) {
      // ファイル読み込みエラーは警告として報告
      issues.push({
        file,
        message: `Cannot read file: ${error.message}`,
      });
    }
  }

  return issues;
}
```

## リカバリー戦略

| エラー種別 | リカバリー |
|-----------|-----------|
| ファイル読み込み失敗 | そのファイルをスキップ、警告を出力 |
| 設定ファイルなし | デフォルト設定を使用 |
| 不明なルール名 | 警告を出力し、そのルールをスキップ |
| グロブパターン不正 | エラーを出力し、処理を中断 |

## ログレベル

| レベル | 用途 | 表示条件 |
|--------|------|---------|
| error | 修正必須の問題 | 常に |
| warn | 改善推奨の問題 | 常に |
| info | 処理状況 | --verbose時 |
| debug | デバッグ情報 | DEBUG環境変数時 |

---

## 関連ドキュメント

- [アーキテクチャ設計](./ARCHITECTURE.md)
- [CLI仕様](../../03-guide/CLI.md)
