# @gu-corp/docs-lint v3

文書構造、必須セクション、内部リンク、用語、要件とテストの対応を検証し、組織ごとの文書テンプレートを配布するためのツールです。

v3 は v2 の互換改修ではなく、設計を再構築したメジャーバージョンです。ルールエンジンから G.U. 固有の文書規約と AI ベンダー依存を分離し、JSON と Markdown だけで構成する **Document Standard Pack** を導入しています。

## 設計原則

- lint の判定ロジックは副作用を持たないルールとして実装する。
- ファイル探索、設定読込、書込は Node アダプターへ隔離する。
- 組織・プロダクト固有の構造と雛形は Standard Pack で管理する。
- 設定・診断レポート・Pack manifest はバージョン付きスキーマとする。
- AI は将来のアダプターとし、lint コアから外部 API を呼ばない。
- v2 の暗黙動作や別名は引き継がず、移行失敗を明示する。

## 必要環境

- Node.js 20 以上
- npm 10 以上を推奨

このパッケージは private repository から利用します。

```bash
npm install --save-dev github:gu-corp/docs-lint#v3.2.0
```

## 最短の利用方法

```bash
npx docs-lint init --root ./docs --pack builtin:gu-corp-software --profile web-application
npx docs-lint lint
```

文書を Standard Pack から作成する例です。

```bash
npx docs-lint create customer-requirements \
  --var productName="Example Product" documentOwner="Product Owner"
```

既存ファイルは `--force` を指定しない限り上書きしません。

## 主なコマンド

| コマンド | 用途 |
| --- | --- |
| `docs-lint lint [--json]` | 文書を検証し、error があれば終了コード 1 を返す |
| `docs-lint init` | v3 設定を新規作成する |
| `docs-lint migrate` | v2 設定の変換案を別ファイルに出力する |
| `docs-lint create <document-type>` | Standard Pack の雛形から文書を作る |
| `docs-lint pack list` | 組み込み Pack を一覧する |
| `docs-lint pack validate <path>` | Pack manifest とテンプレートを検証する |
| `docs-lint pack show <path>` | 継承解決後の profile を表示する |

## 設定

`docs-lint.config.json`:

```json
{
  "$schema": "./node_modules/@gu-corp/docs-lint/schemas/docs-lint-v3.schema.json",
  "schemaVersion": 3,
  "root": "./docs",
  "standard": {
    "pack": "builtin:gu-corp-software",
    "profile": "web-application"
  },
  "rules": {
    "links/internal": "error",
    "document/required-sections": "warning",
    "traceability/requirements-tests": {
      "severity": "error"
    }
  },
  "traceability": {
    "requiredCoverage": 1
  }
}
```

Standard Pack の選択は、文書ルートにある Lunascape Docs の `lunascape-docs.json` でも共有できます。

```json
{
  "documentStandards": {
    "pack": "builtin:gu-corp-software",
    "profile": "regulated-financial-product"
  }
}
```

`docs-lint.config.json` の `standard` が存在する場合は、そちらを優先します。

## ルール

| Rule ID | 既定 | 内容 |
| --- | --- | --- |
| `links/internal` | error | 存在しない内部 Markdown リンク |
| `markdown/headings` | warning | H1 の欠落・重複、見出し階層の飛び |
| `markdown/code-fence-language` | warning | 言語指定のない fenced code block |
| `content/terminology` | warning | Pack または設定で定義した非推奨語 |
| `structure/standard-pack` | error | 必須フォルダ・必須文書 |
| `document/required-sections` | warning | 文書種別ごとの必須見出し |
| `traceability/requirements-tests` | warning | テストから参照されない要件 ID とカバレッジ |

設定値は `off`、`info`、`warning`、`error`、または `severity` と `options` の少なくとも一方を持つオブジェクトです。最上位の設定がseverityを持つ場合は、その設定だけを採用します。最上位がoptions-onlyの場合だけ、そのoptionsを保持してprofile、Pack、ルール既定値の順にseverityを補います。

`options`は登録したcustom ruleへ渡すための継承基盤です。現行のbuilt-in rulesには公開済みのoptionsはありません。custom rule側が契約を定義した場合に限り、たとえば`{"rules":{"company/house-style":{"options":{"dictionary":"company.json"}}}}`のように指定します。

## Programmatic API

```ts
import { loadConfig, lintWorkspace } from '@gu-corp/docs-lint';

const config = loadConfig();
const report = await lintWorkspace(config);
if (!report.passed) process.exitCode = 1;
```

独自ルールは `DocsLintEngine#register()` で登録できます。Rule ID は `domain/name` 形式にします。

### Editor runtime

VS Code ExtensionなどのEditorホストでは、依存関係を同梱したNode ESMランタイムを利用できます。Node組み込みモジュールだけを外部参照に保つため、ホスト側でdocs-lintの依存パッケージを個別に解決する必要はありません。

同梱した第三者コードの通知とライセンス原文は、それぞれ `dist/THIRD-PARTY-NOTICES.md` と `dist/third-party-licenses/` に収録します。

```ts
import { createNodeDocsLintSession } from '@gu-corp/docs-lint/editor-runtime';

const session = createNodeDocsLintSession({
  workspaceRoot: '/workspace/product',
  docsRoot: '/workspace/product/docs',
});

const metadata = session.describe(); // 設定、ルールの出所、Pack、profile、テンプレート
const report = await session.lint();
const templates = session.listTemplates();
const draft = session.renderTemplate('customer-requirements', {
  productName: 'Example Product',
  documentOwner: 'Product Owner',
});
```

設定ファイルは`docsRoot`から`workspaceRoot`まで上方向に探索します。設定内の`root`に関係なく、検査対象は引数の`docsRoot`へ固定されます。設定がなければ`docsRoot`を`.`とする既定設定を使用します。ローカルStandard Packも`workspaceRoot`内に限定し、シンボリックリンクによる逸脱を拒否します。`describe()`は文書本文を読み込まず、Editor UIへ渡せるシリアライズ可能なメタデータだけを返します。有効ルールの`source`はseverityの出所、`optionsSource`はoptionsの出所を表します。

## 文書

- [v3 要件](docs/02-spec/01-requirements/REQUIREMENTS.md)
- [v3 アーキテクチャ](docs/02-spec/02-architecture/ARCHITECTURE.md)
- [Standard Pack ガイド](docs/03-guide/STANDARD-PACKS.md)
- [v2 からの移行](docs/03-guide/MIGRATION-V3.md)

旧 v2 は Git の `v2.0.0` tag と履歴から参照できます。v3 の作業ツリー、ビルド、テスト、配布物には互換コードを残していません。
