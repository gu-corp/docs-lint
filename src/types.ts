/**
 * Configuration for docs-lint
 */
export interface DocsLintConfig {
  /** Root directory for documentation (default: "./docs") */
  docsDir: string;

  /** File patterns to include */
  include: string[];

  /** File patterns to exclude */
  exclude: string[];

  /** Rules configuration */
  rules: RulesConfig;

  /** Terminology dictionary for consistency checks */
  terminology: TerminologyMapping[];

  /** Expected files that must exist */
  requiredFiles: string[];

  /** Requirement ID patterns for coverage tracking */
  requirementPatterns: RequirementPattern[];

  /** i18n configuration for multilingual documents */
  i18n?: I18nConfig;

  /** Testing configuration for code review and quality assessment */
  testing?: TestingConfig;
}

export interface BrokenLinksConfig {
  severity: RuleSeverity;
  /** Paths to exclude from broken link checks (glob patterns) */
  excludePaths?: string[];
}

export interface RulesConfig {
  /** Check for broken markdown links */
  brokenLinks: RuleSeverity | BrokenLinksConfig;

  /** Check for legacy file name patterns */
  legacyFileNames: RuleSeverity | LegacyFileNamesConfig;

  /** Check for version info in documents */
  versionInfo: RuleSeverity | VersionInfoConfig;

  /** Check for related documents section */
  relatedDocuments: RuleSeverity | RelatedDocumentsConfig;

  /** Check heading hierarchy */
  headingHierarchy: RuleSeverity;

  /** Check for TODO/FIXME comments */
  todoComments: RuleSeverity | TodoCommentsConfig;

  /** Check for code block language specifiers */
  codeBlockLanguage: RuleSeverity;

  /** Check for orphan documents */
  orphanDocuments: RuleSeverity;

  /** Check terminology consistency */
  terminology: RuleSeverity;

  /** Check bidirectional references */
  bidirectionalRefs: RuleSeverity;

  /** Check requirements coverage */
  requirementsCoverage: RuleSeverity;

  /** Check i18n file structure (language suffix convention) */
  i18nStructure: RuleSeverity;

  /** Check required files exist */
  requiredFiles: RuleSeverity;

  /** Check folder structure matches expected configuration */
  folderStructure: RuleSeverity;

  /** Check G.U.Corp standard folder structure (01-plan, 02-spec, etc.) */
  standardFolderStructure: RuleSeverity;

  /** Check folder numbering consistency */
  folderNumbering: RuleSeverity | FolderNumberingConfig;

  /** Check file naming conventions */
  fileNaming: RuleSeverity;

  /** Check for duplicate content/titles */
  duplicateContent: RuleSeverity;

  /** Check if development standards files match templates */
  standardsDrift: RuleSeverity | StandardsDriftConfig;

  /** Check standard file naming patterns */
  standardFileNames: RuleSeverity | StandardFileNamesConfig;

  /** Check requirement to test case mapping (100% coverage required) */
  requirementTestMapping: RuleSeverity | RequirementTestMappingConfig;

  /** Run markdownlint for Markdown syntax/formatting checks */
  markdownLint: RuleSeverity | MarkdownLintConfig;
}

export interface StandardsDriftConfig {
  severity: RuleSeverity;
  /** Template categories to check (default: ["04-development"]) */
  categories: string[];
  /** Whether to report missing files */
  reportMissing: boolean;
  /** Whether to report different files */
  reportDifferent: boolean;
}

export interface StandardFileNamesConfig {
  severity: RuleSeverity;
  /** Warn when *-DETAIL.md files exist (should be split into folders) */
  warnDetailFiles: boolean;
  /** Warn when conflicting files exist (e.g., UI.md + SCREEN.md) */
  warnConflicts: boolean;
  /** File conflicts to detect */
  conflicts: FileConflict[];
  /** Patterns that suggest folder splitting */
  detailPatterns: string[];
}

export interface FileConflict {
  /** Files that conflict with each other */
  files: string[];
  /** Recommended file to use */
  preferred: string;
  /** Warning message */
  message: string;
}

export interface RequirementTestMappingConfig {
  severity: RuleSeverity;
  /** Requirement ID pattern (regex) - default: FR-\d+ */
  requirementPattern: string;
  /** Test case ID pattern (regex) - default: TC-\d+ */
  testCasePattern: string;
  /** Requirement files to scan */
  requirementFiles: string[];
  /** Test case files to scan */
  testCaseFiles: string[];
  /** Required coverage percentage (default: 100) */
  requiredCoverage: number;
  /** Whether missing test file is an error */
  requireTestFile: boolean;
  /** Whether requirement IDs are required in requirement files */
  requireRequirementIds: boolean;
  /** Whether test case IDs are required in test files */
  requireTestCaseIds: boolean;
}

export interface MarkdownLintConfig {
  severity: RuleSeverity;
  /** Custom markdownlint rules configuration */
  rules?: Record<string, boolean | Record<string, unknown>>;
  /** File patterns to exclude from markdownlint checks */
  exclude?: string[];
}

export type RuleSeverity = 'off' | 'warn' | 'error';

/** Severity levels for todo comment types */
export type TodoSeverity = 'off' | 'info' | 'warn' | 'error';

/** Configuration for a single todo tag type */
export interface TodoTagConfig {
  /** Severity level for this tag */
  severity: TodoSeverity;
  /** Custom message prefix (optional) */
  message?: string;
}

export interface TodoCommentsConfig {
  /** Base severity (used if tag-specific config not provided) */
  severity: RuleSeverity;

  /** Tag-specific configuration */
  tags?: {
    /** TODO: 今後実装すべきタスク */
    TODO?: TodoTagConfig;
    /** FIXME: 修正が必要なバグ・問題（高優先度） */
    FIXME?: TodoTagConfig;
    /** XXX: 危険なコード・要注意箇所 */
    XXX?: TodoTagConfig;
    /** HACK: 回避策・一時的な実装 */
    HACK?: TodoTagConfig;
    /** BUG: 既知のバグ */
    BUG?: TodoTagConfig;
    /** NOTE: 補足・設計意図の説明 */
    NOTE?: TodoTagConfig;
    /** REVIEW: コードレビュー対象 */
    REVIEW?: TodoTagConfig;
    /** OPTIMIZE: 最適化が必要な箇所 */
    OPTIMIZE?: TodoTagConfig;
    /** WARNING: 警告・注意が必要 */
    WARNING?: TodoTagConfig;
    /** QUESTION: 疑問点・判断保留 */
    QUESTION?: TodoTagConfig;
  };

  /** Custom tags to detect (in addition to built-in tags) */
  customTags?: string[];

  /** Ignore TODO comments in inline code (`code`) */
  ignoreInlineCode?: boolean;

  /** Ignore TODO comments in code blocks (```code```) */
  ignoreCodeBlocks?: boolean;

  /** Ignore TODO comments in tables */
  ignoreInTables?: boolean;

  /** Patterns to exclude from detection (regex strings) */
  excludePatterns?: string[];

  /** File patterns to exclude from this check */
  exclude?: string[];
}

export interface LegacyFileNamesConfig {
  severity: RuleSeverity;
  /** Pattern to detect legacy file names (regex) */
  pattern: string;
  /** Files to exclude from this check */
  exclude: string[];
}

export interface VersionInfoConfig {
  severity: RuleSeverity;
  /** Patterns that indicate version info */
  patterns: string[];
  /** Only check files matching these globs */
  include: string[];
}

export interface RelatedDocumentsConfig {
  severity: RuleSeverity;
  /** Patterns that indicate related documents section */
  patterns: string[];
  /** Only check files matching these globs */
  include: string[];
}

export interface FolderNumberingConfig {
  severity: RuleSeverity;
  /** Paths that require strict numbering (e.g., ["", "02-spec"]) */
  strictPaths: string[];
  /** Whether to check for gaps in numbering sequence */
  checkSequence: boolean;
}

export interface TerminologyMapping {
  /** Preferred term */
  preferred: string;
  /** Variants that should be replaced */
  variants: string[];
  /** Exception patterns that should not be flagged (e.g., "ドキュメンテーション" for "ドキュメント") */
  exceptions?: string[];
  /** Use word boundary matching (default: false for backward compatibility) */
  wordBoundary?: boolean;
}

export interface I18nConfig {
  /** Source language code (e.g., "ja", "en") - the authoritative version */
  sourceLanguage: string;
  /** Target languages for translations */
  targetLanguages?: string[];
  /** Translations folder name (default: "translations") */
  translationsFolder?: string;
  /** Whether to check translation sync (default: false) */
  checkSync?: boolean;
}

/**
 * Testing configuration for code review and quality assessment
 */
export interface TestingConfig {
  /** Project type affects default thresholds and requirements */
  projectType?: 'library' | 'api' | 'web-app' | 'cli' | 'critical';

  /** Glob patterns for core logic files (should have 100% coverage) */
  coreLogicPatterns?: string[];

  /** Glob patterns for utility files */
  utilityPatterns?: string[];

  /** Glob patterns for API/controller files */
  apiPatterns?: string[];

  /** Glob patterns for UI/presentation files */
  uiPatterns?: string[];

  /** Glob patterns to exclude from coverage analysis */
  excludePatterns?: string[];

  /** Coverage thresholds by category (percentage) */
  coverageThresholds?: {
    /** Core business logic - default: 100 */
    coreLogic?: number;
    /** Utility functions - default: 90 */
    utilities?: number;
    /** API/controllers - default: 80 */
    api?: number;
    /** UI/presentation - default: 60 */
    ui?: number;
    /** Overall minimum - default: 70 */
    overall?: number;
  };

  /** Require integration tests for these patterns */
  requireIntegrationTests?: string[];

  /** Require E2E tests (default: based on projectType) */
  requireE2ETests?: boolean;

  /** Minimum test file coverage (percentage of source files with tests) */
  minTestFileCoverage?: number;

  /** Require CI test configuration */
  requireCITests?: boolean;
}

export interface RequirementPattern {
  /** Name of the requirement category */
  name: string;
  /** Regex pattern to match requirement IDs */
  pattern: string;
  /** File to extract requirements from */
  sourceFile: string;
  /** File to check for coverage */
  coverageFile: string;
}

/**
 * Lint result types
 */
export interface LintResult {
  /** Total number of files checked */
  filesChecked: number;

  /** Results by rule */
  ruleResults: RuleResult[];

  /** Overall pass/fail status */
  passed: boolean;

  /** Summary statistics */
  summary: LintSummary;
}

export interface RuleResult {
  /** Rule name */
  rule: string;

  /** Severity level */
  severity: RuleSeverity;

  /** Issues found */
  issues: LintIssue[];

  /** Did this rule pass? */
  passed: boolean;
}

export interface LintIssue {
  /** File path relative to docs root */
  file: string;

  /** Line number (1-based, optional) */
  line?: number;

  /** Issue message */
  message: string;

  /** Suggested fix (optional) */
  suggestion?: string;

  /** Issue-specific severity (for rules with mixed severities like todoComments) */
  severity?: 'info' | 'warn' | 'error';
}

export interface LintSummary {
  errors: number;
  warnings: number;
  passed: number;
}

/**
 * Default configuration
 */
export const defaultConfig: DocsLintConfig = {
  docsDir: './docs',
  include: ['**/*.md'],
  exclude: [
    '**/_*/**',      // Archive folders (e.g., _archive/, _drafts/)
    '**/_*.md',      // Archive files (e.g., _OLD-API.md)
  ],
  rules: {
    brokenLinks: 'error',
    legacyFileNames: 'error',
    versionInfo: 'warn',
    relatedDocuments: 'warn',
    headingHierarchy: 'warn',
    todoComments: {
      severity: 'warn',
      tags: {
        TODO: { severity: 'info', message: '実装予定' },
        FIXME: { severity: 'warn', message: '要修正' },
        XXX: { severity: 'warn', message: '要注意' },
        HACK: { severity: 'warn', message: '回避策' },
        BUG: { severity: 'error', message: 'バグ' },
        NOTE: { severity: 'off' },
        REVIEW: { severity: 'info', message: 'レビュー対象' },
        OPTIMIZE: { severity: 'info', message: '最適化候補' },
        WARNING: { severity: 'warn', message: '警告' },
        QUESTION: { severity: 'info', message: '要確認' },
      },
      ignoreInlineCode: true,
      ignoreCodeBlocks: true,
      ignoreInTables: false,
    },
    codeBlockLanguage: 'warn',
    orphanDocuments: 'warn',
    terminology: 'warn',
    bidirectionalRefs: 'off',
    requirementsCoverage: 'warn',
    i18nStructure: 'off',
    requiredFiles: 'warn',
    folderStructure: 'warn',
    standardFolderStructure: 'error',
    folderNumbering: {
      severity: 'warn',
      strictPaths: ['', '02-spec'],
      checkSequence: true,
    },
    fileNaming: 'warn',
    duplicateContent: 'warn',
    standardsDrift: {
      severity: 'warn',
      categories: ['04-development'],
      reportMissing: true,
      reportDifferent: true,
    },
    standardFileNames: {
      severity: 'warn',
      warnDetailFiles: true,
      warnConflicts: true,
      conflicts: [
        {
          files: ['UI.md', 'SCREEN.md'],
          preferred: 'SCREEN.md',
          message: 'UI.md と SCREEN.md が両方存在します。SCREEN.md に統合してください',
        },
      ],
      detailPatterns: ['-DETAIL.md', '-DETAILS.md'],
    },
    requirementTestMapping: {
      severity: 'error',
      requirementPattern: 'FR-([A-Z]+-)*\\d{3}',
      testCasePattern: 'TC-[UIEPSDX]\\d{3}',
      requirementFiles: ['**/REQUIREMENTS.md', '**/01-requirements/**/*.md'],
      testCaseFiles: ['**/TEST-CASES.md', '**/TEST.md', '**/05-testing/**/*.md', '**/*-TESTS.md', '**/DEFERRED-TESTS.md'],
      requiredCoverage: 100,
      requireTestFile: true,
      requireRequirementIds: true,
      requireTestCaseIds: true,
    },
    markdownLint: 'warn',
  },
  terminology: [],
  requiredFiles: [],
  requirementPatterns: [],
  testing: {
    projectType: 'api',
    coreLogicPatterns: [
      'src/domain/**/*.ts',
      'src/lib/**/*.ts',
      'src/core/**/*.ts',
      'src/rules/**/*.ts',
      'src/services/**/*.ts',
      'src/usecases/**/*.ts',
    ],
    utilityPatterns: [
      'src/utils/**/*.ts',
      'src/helpers/**/*.ts',
      'src/shared/**/*.ts',
    ],
    apiPatterns: [
      'src/api/**/*.ts',
      'src/controllers/**/*.ts',
      'src/routes/**/*.ts',
      'src/handlers/**/*.ts',
    ],
    uiPatterns: [
      'src/components/**/*.tsx',
      'src/pages/**/*.tsx',
      'src/views/**/*.tsx',
    ],
    excludePatterns: [
      '**/*.test.ts',
      '**/*.spec.ts',
      '**/*.test.tsx',
      '**/*.spec.tsx',
      '**/index.ts',
      '**/*.d.ts',
      '**/types.ts',
      '**/__mocks__/**',
      '**/__fixtures__/**',
    ],
    coverageThresholds: {
      coreLogic: 100,
      utilities: 90,
      api: 80,
      ui: 60,
      overall: 70,
    },
    requireIntegrationTests: [
      'src/api/**/*.ts',
      'src/controllers/**/*.ts',
    ],
    requireE2ETests: false,
    minTestFileCoverage: 80,
    requireCITests: true,
  },
};
