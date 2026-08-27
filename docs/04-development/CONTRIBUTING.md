# Contributing

## 検証

```bash
npm ci --ignore-scripts --workspaces=false
npm run check
npm test
npm run build
npm audit --omit=dev --workspaces=false
```

## 境界

- filesystem 操作は `src/node/` に置く。
- CLI option と表示は `src/cli/` に置く。
- rule は `src/core/rules/` に置き、外部 I/O を行わない。
- 組織固有の folder、title、template は `packs/` に置く。
- public contract を変える場合は schema と migration guide を同時に更新する。

## 変更時のテスト

新しい rule は severity override、file/location、例外処理を確認する。Pack 変更は全 template の render と manifest validation を通す。path を扱う変更には traversal test を追加する。
