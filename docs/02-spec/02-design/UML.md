# UML設計図

**バージョン**: 1.0
**更新日**: 2025-12-10

---

## 概要

docs-lint の主要なUML図を記載します。

## シーケンス図

### lint コマンド実行フロー

```mermaid
sequenceDiagram
    participant User
    participant CLI
    participant Config
    participant Linter
    participant Rules
    participant FileSystem

    User->>CLI: docs-lint lint
    CLI->>Config: loadConfig()
    Config->>FileSystem: read config file
    FileSystem-->>Config: config data
    Config-->>CLI: DocsLintConfig
    CLI->>Linter: createLinter(config)
    CLI->>Linter: lint()

    loop For each enabled rule
        Linter->>Rules: execute rule
        Rules->>FileSystem: read files
        FileSystem-->>Rules: file contents
        Rules-->>Linter: RuleResult[]
    end

    Linter-->>CLI: LintResult
    CLI-->>User: formatted output
```

### init コマンド実行フロー

```mermaid
sequenceDiagram
    participant User
    participant CLI
    participant FileSystem

    User->>CLI: docs-lint init
    CLI->>User: プロンプト表示（docsDir）
    User-->>CLI: ./docs
    CLI->>User: プロンプト表示（rules severity）
    User-->>CLI: warn
    CLI->>FileSystem: write docs-lint.config.json
    FileSystem-->>CLI: success
    CLI->>FileSystem: write docs/docs.config.json
    FileSystem-->>CLI: success
    CLI-->>User: 設定完了メッセージ
```

## クラス図

### コアクラス

```mermaid
classDiagram
    class Linter {
        -config: DocsLintConfig
        -options: LinterOptions
        +lint(): Promise~LintResult~
        +lintStructure(options): Promise~RuleResult[]~
    }

    class DocsLintConfig {
        +docsDir: string
        +include: string[]
        +exclude: string[]
        +rules: RulesConfig
        +terminology: TerminologyRule[]
        +requiredFiles: string[]
    }

    class LintResult {
        +passed: boolean
        +filesChecked: number
        +summary: LintSummary
        +ruleResults: RuleResult[]
    }

    class RuleResult {
        +rule: string
        +passed: boolean
        +severity: RuleSeverity
        +issues: Issue[]
    }

    class Issue {
        +file: string
        +line: number
        +message: string
        +suggestion: string
    }

    Linter --> DocsLintConfig
    Linter --> LintResult
    LintResult --> RuleResult
    RuleResult --> Issue
```

### ルールクラス

```mermaid
classDiagram
    class ContentRules {
        +checkBrokenLinks(docsDir, files): Issue[]
        +checkLegacyFileNames(docsDir, files): Issue[]
        +checkVersionInfo(docsDir, files): Issue[]
        +checkHeadingHierarchy(docsDir, files): Issue[]
        +checkTodoComments(docsDir, files): Issue[]
        +checkCodeBlockLanguage(docsDir, files): Issue[]
    }

    class StructureRules {
        +checkStandardFolderStructure(docsDir): Issue[]
        +checkFolderNumbering(docsDir, config): Issue[]
        +checkFileNaming(docsDir, files): Issue[]
        +checkRequirementTestMapping(docsDir, files): Issue[]
    }

    class TerminologyRules {
        +checkTerminology(docsDir, files, terminology): Issue[]
    }

    ContentRules ..> Issue : creates
    StructureRules ..> Issue : creates
    TerminologyRules ..> Issue : creates
```

## 状態遷移図

### リント実行状態

```mermaid
stateDiagram-v2
    [*] --> Initializing: lint command
    Initializing --> LoadingConfig: load config
    LoadingConfig --> ConfigError: config invalid
    ConfigError --> [*]: exit 2
    LoadingConfig --> Scanning: config valid
    Scanning --> Linting: files found
    Scanning --> NoFiles: no files
    NoFiles --> [*]: exit 0 (warning)
    Linting --> Reporting: all rules executed
    Reporting --> Success: no errors
    Reporting --> Failure: errors found
    Success --> [*]: exit 0
    Failure --> [*]: exit 1
```

## コンポーネント図

```mermaid
graph TB
    subgraph CLI["CLI Layer"]
        lint[lint command]
        init[init command]
        scaffold[scaffold command]
    end

    subgraph Core["Core Layer"]
        linter[Linter]
        config[ConfigLoader]
        templates[Templates]
    end

    subgraph Rules["Rules Layer"]
        content[Content Rules]
        structure[Structure Rules]
        terminology[Terminology Rules]
    end

    subgraph Output["Output Layer"]
        console[Console Formatter]
        json[JSON Formatter]
        ai[AI Prompt Generator]
    end

    lint --> linter
    init --> config
    scaffold --> templates
    linter --> content
    linter --> structure
    linter --> terminology
    linter --> console
    linter --> json
    linter --> ai
```

---

## 関連ドキュメント

- [アーキテクチャ設計](./ARCHITECTURE.md)
- [クラス設計](./CLASS.md)
- [API仕様](./API.md)
