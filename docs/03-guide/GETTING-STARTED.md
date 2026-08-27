# Getting Started

## 導入

```bash
npm install --save-dev github:gu-corp/docs-lint#v3.1.1
npx docs-lint init --root ./docs --pack builtin:gu-corp-software --profile web-application
```

## 最初の文書作成

```bash
npx docs-lint create customer-requirements \
  --var productName="My Product" documentOwner="Product Owner"
```

## 検証

```bash
npx docs-lint lint
npx docs-lint lint --json
```

CI では `docs-lint lint` の終了コードを使用する。warning だけなら成功、error があれば失敗する。
