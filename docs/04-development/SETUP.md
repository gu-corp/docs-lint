# 開発環境セットアップ

**バージョン**: 1.18.0
**更新日**: 2026-02-18

---

## 概要

docs-lint の開発環境構築手順を説明します。

## 前提条件

- Node.js 18以上
- npm 9以上
- Git

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/gu-corp/docs-lint.git
cd docs-lint
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. ビルド

```bash
npm run build
```

### 4. テスト実行

```bash
npm test
```

## 開発コマンド

| コマンド | 説明 |
|---------|------|
| `npm run build` | TypeScriptをコンパイル |
| `npm run dev` | ウォッチモードでコンパイル |
| `npm run lint` | ESLintを実行 |
| `npm test` | Vitestでテスト実行 |

## ディレクトリ構成

```text
docs-lint/
├── src/
│   ├── cli.ts              # CLIエントリーポイント
│   ├── linter.ts           # メインリンターエンジン
│   ├── types.ts            # TypeScript型定義
│   ├── ai-prompt.ts        # AI向けプロンプト生成
│   ├── index.ts            # パブリックAPI
│   ├── cli/
│   │   └── config.ts       # 設定ローダー
│   ├── rules/
│   │   ├── content.ts      # コンテンツルール
│   │   ├── structure.ts    # 構造ルール
│   │   └── terminology.ts  # 用語ルール
│   ├── templates/
│   │   ├── standards.ts    # 標準テンプレート
│   │   └── translations/   # 多言語対応
│   └── __tests__/          # テストファイル
├── dist/                   # コンパイル済みファイル
├── docs/                   # ドキュメント
├── templates/              # 開発標準テンプレート
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## ローカルでの実行

ビルド後、以下でCLIを実行できます：

```bash
# ローカルビルドを実行
./dist/cli.js lint -d ./docs

# npm linkでグローバルにリンク
npm link
docs-lint lint -d ./docs
```

## デバッグ

### VSCode

`.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug CLI",
      "program": "${workspaceFolder}/dist/cli.js",
      "args": ["lint", "-v"],
      "outFiles": ["${workspaceFolder}/dist/**/*.js"]
    }
  ]
}
```

### 環境変数

```bash
# デバッグログを有効化
DEBUG=docs-lint:* npm run build && ./dist/cli.js lint
```

## テストの追加

新しいテストは `src/__tests__/` に追加：

```typescript
// src/__tests__/newRule.test.ts
import { describe, it, expect } from 'vitest';
import { checkNewRule } from '../rules/newRule';

describe('checkNewRule', () => {
  it('should detect issues', async () => {
    const issues = await checkNewRule('./test-docs', ['test.md']);
    expect(issues).toHaveLength(1);
  });
});
```

## コントリビューション

1. featureブランチを作成
2. 変更を実装
3. テストを追加・実行
4. PRを作成

---

## 関連ドキュメント

- [アーキテクチャ設計](../02-spec/02-architecture/ARCHITECTURE.md)
- [CI/CD設定](./CI-CD.md)
