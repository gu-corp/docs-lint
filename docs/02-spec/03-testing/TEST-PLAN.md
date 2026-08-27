# docs-lint v3 テスト計画

## 対象範囲

v3 の config、Standard Pack、rule engine、Node adapter、CLI build を対象とする。凍結した `legacy-v2/` は回帰テスト対象外とする。

## テスト戦略

| レベル | 対象 | 主な観点 |
| --- | --- | --- |
| Unit | manifest、config、engine | 継承、優先順位、例外、schema version |
| Integration | workspace lint、Pack rendering | 実ファイル探索、必須文書、全 template 展開 |
| CLI/runtime smoke | built `dist/cli.js`、Editor runtime | list、validate、lint JSON、bundle import、第三者ライセンス収録 |
| Security | path handling | traversal、symlink escape、上書き拒否 |

## 環境・データ

テストは OS の temporary directory に fixture を作り、終了後に削除する。組み込み Pack は実体を読み、全 document type をレンダリングする。

## 開始・終了条件

| 種別 | 条件 |
| --- | --- |
| 開始 | Node.js 20 以上、lockfile に基づく依存導入済み |
| 終了 | typecheck、unit/integration tests、clean build、CLI smoke、production audit が成功 |

## 要件トレーサビリティ

| テスト群 | 要件 |
| --- | --- |
| config.test.ts | SR-CFG-001、SR-CFG-003 |
| manifest.test.ts | SR-PACK-002 |
| standard-pack.test.ts | SR-PACK-003、SR-PACK-004 |
| editor-session.test.ts | SR-CFG-003、SR-SEC-006 |
| engine.test.ts | SR-CORE-001〜003、SR-CFG-002、SR-LINT-005〜006 |
| CLI/runtime smoke | SR-CLI-001〜003、SR-NFR-007 |
