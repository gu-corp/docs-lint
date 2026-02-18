# ルール実装詳細

**バージョン**: 2.0.0
**更新日**: 2026-02-18

---

## 概要

各リントルールの判定ロジックと実装詳細を定義します。

## ルール一覧

| カテゴリ | ルール | 説明 |
|---------|--------|------|
| コンテンツ | brokenLinks | 内部リンク切れ検出 |
| コンテンツ | legacyFileNames | レガシーファイル名参照検出 |
| コンテンツ | versionInfo | バージョン情報有無 |
| コンテンツ | relatedDocuments | 関連ドキュメントセクション有無 |
| コンテンツ | headingHierarchy | 見出し階層チェック |
| コンテンツ | todoComments | TODO/FIXMEコメント検出 |
| コンテンツ | codeBlockLanguage | コードブロック言語指定 |
| コンテンツ | orphanDocuments | 孤立ドキュメント検出 |
| コンテンツ | terminology | 用語統一チェック |
| 構造 | standardFolderStructure | 標準フォルダ構成 |
| 構造 | folderNumbering | フォルダ番号付け |
| 構造 | fileNaming | ファイル命名規則 |
| 構造 | standardsDrift | テンプレート差分検出 |
| 追跡 | requirementTestMapping | 要件-テスト対応 |
| フォーマット | markdownLint | Markdownフォーマット |

---

## コンテンツルール

### brokenLinks

**目的**: 内部リンク切れを検出する

**判定ロジック**:

```text
1. 正規表現でMarkdownリンクを抽出
   パターン: \[([^\]]+)\]\(([^)]+\.md)\)

2. 外部リンク（http://）をスキップ

3. 相対パスを絶対パスに解決
   基準: リンク元ファイルのディレクトリ

4. ファイル存在チェック
   fs.existsSync(absolutePath)

5. 存在しない場合はエラー報告
```

**検出例**:

```text
# NG: リンク先が存在しない
[設計書]\(./DESIGN.md\)  ← DESIGN.mdが存在しない

# OK: リンク先が存在する
[設計書]\(./ARCHITECTURE.md\)  ← ファイルが存在する
```

### legacyFileNames

**目的**: 旧命名規則のファイル参照を検出する

**判定ロジック**:

```text
1. 設定されたパターンで検索
   デフォルト: \d{2}-[A-Z][A-Z0-9-]+\.md
   （例: 01-OVERVIEW.md, 02-SPEC.md）

2. コードブロック内をスキップ

3. インラインコード内をスキップ

4. マッチした場合は警告/エラー報告
```

**検出例**:

```text
# NG: レガシー命名パターン
詳細は [01-OVERVIEW.md]\(./01-OVERVIEW.md\) を参照

# OK: 新しい命名パターン
詳細は [OVERVIEW.md]\(./OVERVIEW.md\) を参照
```

### versionInfo

**目的**: ドキュメントにバージョン情報があるか確認する

**判定ロジック**:

```text
1. 対象ファイルをフィルタリング
   include パターンにマッチするファイルのみ

2. 設定されたパターンを検索
   デフォルト: "**バージョン**:" または "**Version**:"

3. パターンが見つからない場合は警告報告
```

**期待フォーマット**:

```markdown
# ドキュメントタイトル

**バージョン**: 2.0.0
**更新日**: 2026-02-18
```

### relatedDocuments

**目的**: 関連ドキュメントセクションの有無を確認する

**判定ロジック**:

```text
1. 対象ファイルをフィルタリング

2. 設定されたパターンを検索
   デフォルト: "関連ドキュメント" または "Related Documents"

3. パターンが見つからない場合は警告報告
```

**期待フォーマット**:

```text
---

## 関連ドキュメント

- [アーキテクチャ設計]\(./ARCHITECTURE.md\)
- [API仕様]\(./API.md\)
```

### headingHierarchy

**目的**: 見出しの階層が正しいか確認する

**判定ロジック**:

```text
1. 各行を走査

2. コードブロック内をスキップ

3. 見出しパターンを検出
   パターン: ^(#{1,6})\s

4. 階層をトラッキング
   - 初回見出しはそのまま記録
   - 2回目以降: level > lastLevel + 1 ならエラー

5. H1→H3のようなスキップを検出
```

**検出例**:

```markdown
# H1 タイトル
### H3 セクション    ← NG: H2をスキップ

# H1 タイトル
## H2 セクション     ← OK
### H3 サブセクション ← OK
```

### todoComments

**目的**: TODO/FIXME等のコメントを検出する

**判定ロジック**:

```text
1. 検出対象タグ
   組み込み: TODO, FIXME, XXX, HACK, BUG, NOTE, REVIEW, OPTIMIZE, WARNING, QUESTION
   + customTags で追加可能

2. 検出パターン
   \b(TAG)[:：]\s*(.*)
   ※コロンが必須（誤検出防止）

3. 除外条件
   - ignoreCodeBlocks: コードブロック内をスキップ
   - ignoreInlineCode: インラインコード内をスキップ
   - ignoreInTables: テーブル内をスキップ
   - excludePatterns: 正規表現でマッチする行をスキップ

4. タグ別重要度
   - severity: off → 無視
   - severity: info/warn/error → 該当レベルで報告
```

**検出例**:

```markdown
<!-- 検出される -->
TODO: 後で実装する
FIXME: バグを修正する
BUG: 既知の問題

<!-- 検出されない（コロンがない）-->
TODO 後で実装する
Review Status: 完了

<!-- 検出されない（コードブロック内）-->
```typescript
// TODO: これは無視される
```

```

### codeBlockLanguage

**目的**: コードブロックに言語指定があるか確認する

**判定ロジック**:

```text
1. 各行を走査

2. "```" のみの行を検出

3. 次の行が空でない場合（コードがある場合）
   → 言語指定がないと判定

4. 警告報告
```

**検出例**:

````markdown
<!-- NG: 言語指定なし -->
```
const x = 1;
```

<!-- OK: 言語指定あり -->
```typescript
const x = 1;
```

<!-- OK: 空のコードブロック -->
```
```
````

### orphanDocuments

**目的**: どこからもリンクされていない孤立ドキュメントを検出する

**判定ロジック**:

```text
1. 全ファイルのリンクを収集
   パターン: \[([^\]]+)\]\(([^)]+\.md)\)

2. リンク先を正規化（絶対パス変換）

3. 参照されているファイルのセットを作成

4. 全ファイルと比較
   - README.md, index.md は除外
   - 参照されていないファイルを報告
```

### terminology

**目的**: 用語の不統一を検出する

**判定ロジック**:

```text
1. terminology 設定から用語マッピングを取得
   {
     preferred: "API",
     variants: ["api", "Api"],
     exceptions: [...],
     wordBoundary: true/false
   }

2. 各ファイルを走査

3. コードブロック・インラインコードをスキップ

4. variants にマッチする用語を検出
   - wordBoundary: true の場合は単語境界でマッチ
   - exceptions にマッチする場合はスキップ

5. preferred への置換を提案
```

---

## 構造ルール

### standardFolderStructure

**目的**: G.U.Corp 標準フォルダ構成をチェックする

**判定ロジック**:

```text
1. 必須フォルダの存在チェック
   - 01-plan/
   - 02-spec/
   - 03-guide/
   - 04-development/

2. 02-spec/ サブフォルダチェック
   - 01-requirements/ (必須)
   - 04-testing/ または 05-testing/ (必須)

3. 欠落フォルダをエラー報告
```

### folderNumbering

**目的**: フォルダ番号付けの一貫性をチェックする

**判定ロジック**:

```text
1. strictPaths で指定されたパスを走査
   デフォルト: ["", "02-spec"]（ルートと02-spec）

2. 番号付きフォルダを収集
   パターン: ^\d{2}-

3. 番号なしフォルダを検出
   → strictPaths 内なら警告

4. checkSequence: true の場合
   → 連番チェック（01, 02, 03...）
   → 欠番を警告
```

### fileNaming

**目的**: ファイル命名規則をチェックする

**判定ロジック**:

```text
1. Markdownファイルを走査

2. 命名規則チェック
   - UPPER-CASE.md 形式を推奨
   - README.md, index.md は例外

3. 違反を警告
```

### standardsDrift

**目的**: 開発標準ファイルがテンプレートと異なるか検出する

**判定ロジック**:

```text
1. categories で指定されたフォルダを走査
   デフォルト: ["04-development"]

2. 対応するテンプレートファイルを取得
   templates/04-development/GIT-WORKFLOW.md など

3. 内容を比較
   - reportMissing: 欠落ファイルを報告
   - reportDifferent: 差分を報告
```

---

## 追跡ルール

### requirementTestMapping

**目的**: 要件IDとテストケースIDの対応をチェックする

**判定ロジック**:

```text
1. requirementFiles から要件IDを収集
   パターン: FR-([A-Z]+-)*\d{3}
   例: FR-001, FR-AUTH-001, FR-AUTH-LOGIN-001

2. testCaseFiles からテストケースIDと対応要件を収集
   パターン: TC-[UIEPSDX]\d{3}
   例: TC-U001, TC-I001, TC-E001

3. マッピングチェック
   - 各要件に対応するテストケースがあるか
   - TC-D (Deferred), TC-X (Excluded) は除外

4. カバレッジ計算
   covered / total * 100

5. requiredCoverage (デフォルト: 100) 未満なら報告
```

**テストケースIDプレフィックス**:

| プレフィックス | カテゴリ | 説明 |
|---------------|---------|------|
| TC-U | Unit | 単体テスト |
| TC-I | Integration | 結合テスト |
| TC-E | E2E | E2Eテスト |
| TC-P | Performance | 性能テスト |
| TC-S | Security | セキュリティテスト |
| TC-D | Deferred | 延期（カバレッジ計算から除外） |
| TC-X | Excluded | 対象外（カバレッジ計算から除外） |

---

## フォーマットルール

### markdownLint

**目的**: markdownlint によるフォーマットチェックを実行する

**判定ロジック**:

```text
1. markdownlint ライブラリを使用
   markdownlint/sync の lint 関数

2. 設定されたルールを適用
   rules オプションで個別有効/無効化可能

3. 検出された問題を報告
   - ルールID（例: MD013, MD033）
   - 行番号
   - メッセージ

4. --fix オプション時
   applyFixes 関数で自動修正
```

**主要ルール**:

| ルールID | 説明 | デフォルト |
|----------|------|-----------|
| MD013 | 行の長さ制限 | 有効 |
| MD031 | コードブロック前後の空行 | 有効 |
| MD033 | インラインHTML | 有効 |
| MD041 | 最初の行はH1 | 有効 |

---

## 共通ヘルパー関数

### isInCodeBlock

コードブロック内かどうかを判定します。

```typescript
function isInCodeBlock(lines: string[], lineIndex: number): boolean {
  let inCodeBlock = false;
  for (let i = 0; i < lineIndex; i++) {
    if (lines[i].trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
    }
  }
  return inCodeBlock;
}
```

### isInInlineCode

インラインコード内かどうかを判定します。

```typescript
function isInInlineCode(line: string, position: number): boolean {
  let inCode = false;
  for (let i = 0; i < position; i++) {
    if (line[i] === '`' && line.substring(i, i + 3) !== '```') {
      inCode = !inCode;
    }
  }
  return inCode;
}
```

### isTableLine

テーブル行かどうかを判定します。

```typescript
function isTableLine(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith('|') && trimmed.endsWith('|');
}
```

---

## 関連ドキュメント

- [設定スキーマ仕様](./CONFIG-SCHEMA.md)
- [CLIリファレンス](../../03-guide/CLI.md)
- [ルールリファレンス](../../03-guide/RULES.md)
- [クラス設計](../02-architecture/CLASS.md)
