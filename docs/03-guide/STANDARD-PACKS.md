# Document Standard Packs

## 役割

Standard Pack は文書の構造、文書種別、必須 section、用語、雛形、profile を一つの versioned package として管理する。アプリケーションの実装コードを含めない。

## 構成

```text
my-standard/
├── pack.json
└── templates/
    ├── requirements.md
    └── architecture.md
```

manifest は repository root の `schemas/standard-pack.schema.json` に従う。template 変数は `{{name}}` 形式であり、組み込み変数は `date`、`packId`、`packVersion`、`canonicalLocale` である。

## profile

profile は対象システムごとの文書集合と厳格度を表す。共通の `base` を継承し、`web-application`、`api-service`、`regulated-financial-product` などを定義できる。継承循環と存在しない document type は validation error になる。

## 検証

```bash
npx docs-lint pack validate ./my-standard
npx docs-lint pack show ./my-standard --profile api-service --json
```

## 安全性

Pack template は Pack root 内の通常ファイルに限る。path traversal、root 外 symlink、未解決変数を拒否する。Pack に JavaScript を置いても実行しない。
