# Configuration

## 探索

`docs-lint` は current directory から親へ `docs-lint.config.json` を探索する。`--config` が指定された場合はそのファイルだけを使う。相対 `root` と相対 Pack path は設定ファイルのある directory を基準にする。

## v3 設定

```json
{
  "schemaVersion": 3,
  "root": "./docs",
  "include": ["**/*.md", "**/*.mdx"],
  "exclude": ["**/99-archive/**"],
  "standard": {
    "pack": "builtin:gu-corp-software",
    "profile": "api-service"
  },
  "rules": {
    "links/internal": "error",
    "traceability/requirements-tests": "warning"
  },
  "traceability": {
    "requirementFiles": ["**/*REQUIREMENTS*.md"],
    "testFiles": ["**/*TEST*.md"],
    "requiredCoverage": 1
  }
}
```

`standard.pack` は `builtin:<name>` または local path を受け付ける。v3.0 は URL からの動的 download を行わない。

## Editor との共有

`standard` が docs-lint config にない場合、文書 root の `lunascape-docs.json` を読む。そこに書いた相対 Pack path は文書 root 基準である。
