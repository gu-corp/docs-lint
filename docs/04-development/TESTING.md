# テスト規約

**バージョン**: 1.18.0
**更新日**: 2026-02-18

---

## 概要

本文書は、G.U.Corp プロジェクトにおけるテストの標準規約を定めます。

---

## 1. テスト種別と責務

### 1.1 テストピラミッド

```text
        /\
       /  \     E2E テスト (10%)
      /----\    - ユーザーシナリオ検証
     /      \
    /--------\  Integration テスト (20%)
   /          \ - API・DB連携検証
  /------------\
 /              \ Unit テスト (70%)
/----------------\ - 関数・クラス単体検証
```

### 1.2 テスト種別一覧

| 種別 | 対象 | ツール | 実行タイミング |
|------|------|--------|----------------|
| Unit | 関数・クラス | Vitest/Jest | pre-commit, CI |
| Integration | API・DB連携 | Vitest/Jest | CI |
| E2E | ユーザーフロー | Playwright | CI, Staging |

---

## 2. 必須テスト要件

### 2.1 ファイル対応規則

| ソースパターン | テストパターン | 必須 |
|----------------|----------------|------|
| `src/**/*.ts` | `tests/**/*.test.ts` or `src/**/*.test.ts` | Yes |
| `src/lib/**/*.ts` | 対応するテストファイル | Yes |
| `src/api/**/*.ts` | Integration テスト必須 | Yes |
| `src/components/**/*.tsx` | コンポーネントテスト | Recommended |

### 2.2 カバレッジ基準

#### カテゴリ別目標

| カテゴリ | パターン | 目標 | 理由 |
|----------|---------|------|------|
| **コアロジック** | `src/domain/`, `src/lib/`, `src/core/`, `src/rules/`, `src/services/`, `src/usecases/` | **100%** | ビジネス価値の源泉。バグ許容度ゼロ |
| **ユーティリティ** | `src/utils/`, `src/helpers/`, `src/shared/` | **90%** | 再利用されるため影響範囲大 |
| **API/コントローラ** | `src/api/`, `src/controllers/`, `src/routes/` | **80%** | Integrationテストと併用 |
| **UI/プレゼンテーション** | `src/components/`, `src/pages/`, `src/views/` | **60%** | E2Eでカバー |
| **設定/グルーコード** | `src/config/`, `**/index.ts` | - | フレームワーク依存、起動時に検証 |

#### プロジェクト種別による要件

| 種別 | UT必須 | 最低カバレッジ | Integration | E2E |
|------|--------|--------------|-------------|-----|
| **library** (SDK/ライブラリ) | Yes | 80% | - | - |
| **api** (APIサービス) | Yes | 70% | Yes | - |
| **web-app** (Webアプリ) | Yes | 60% | Yes | Yes |
| **cli** (CLIツール) | Yes | 60% | - | - |
| **critical** (金融/決済/医療) | Yes | 90% | Yes | Yes |

#### 判断ガイドライン

**コアロジック100%を目指す理由**:

- テストできないコード = 設計に問題がある兆候
- バグ発生時の影響が大きい
- 仕様変更時のリグレッション防止

**100%が適切でない場合**:

- 外部サービス連携部分（モック過多になる）
- フレームワークが生成するコード
- 単純なラッパー関数

**カバレッジ測定対象外**:

- `**/*.test.ts`, `**/*.spec.ts`
- `**/index.ts`
- `**/*.d.ts`, `**/types.ts`
- `**/__mocks__/**`, `**/__fixtures__/**`

### 2.3 クリティカル機能

以下の機能は **E2E テスト必須**:

- 認証・認可フロー
- 決済・課金処理
- データ削除操作
- 外部API連携

---

## 3. テストファイル構成

### 3.1 ディレクトリ構造

```text
project/
├── src/
│   ├── lib/
│   │   └── auth.ts
│   └── api/
│       └── users.ts
├── tests/
│   ├── unit/
│   │   └── lib/
│   │       └── auth.test.ts
│   ├── integration/
│   │   └── api/
│   │       └── users.test.ts
│   └── e2e/
│       └── auth.spec.ts
└── vitest.config.ts
```

### 3.2 テストファイル命名規則

| 種別 | パターン | 例 |
|------|----------|-----|
| Unit | `*.test.ts` | `auth.test.ts` |
| Integration | `*.test.ts` | `users.test.ts` |
| E2E | `*.spec.ts` | `auth.spec.ts` |

---

## 4. テストコード規約

### 4.1 基本構造

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { validateUser } from '@/lib/auth';

describe('validateUser', () => {
  describe('valid input', () => {
    it('should return true for valid email', () => {
      expect(validateUser({ email: 'test@example.com' })).toBe(true);
    });
  });

  describe('invalid input', () => {
    it('should return false for empty email', () => {
      expect(validateUser({ email: '' })).toBe(false);
    });

    it('should return false for malformed email', () => {
      expect(validateUser({ email: 'invalid' })).toBe(false);
    });
  });
});
```

### 4.2 命名規則

| 要素 | 規則 | 例 |
|------|------|-----|
| describe | 対象の名前 | `describe('validateUser', ...)` |
| it | should + 期待動作 | `it('should return true for valid input', ...)` |

### 4.3 AAA パターン

```typescript
it('should calculate total correctly', () => {
  // Arrange: 準備
  const items = [{ price: 100 }, { price: 200 }];

  // Act: 実行
  const result = calculateTotal(items);

  // Assert: 検証
  expect(result).toBe(300);
});
```

---

## 5. モック・スタブ規約

### 5.1 外部依存のモック

```typescript
import { vi } from 'vitest';

// API クライアントのモック
vi.mock('@/lib/api', () => ({
  fetchUser: vi.fn().mockResolvedValue({ id: 1, name: 'Test' }),
}));
```

### 5.2 モック使用ガイドライン

| 対象 | モック | 理由 |
|------|--------|------|
| 外部API | 必須 | 安定性・速度 |
| データベース | Integration以外 | Unit は純粋関数テスト |
| 時間・乱数 | 推奨 | 再現性確保 |
| ファイルシステム | 推奨 | 環境依存排除 |

---

## 6. CI/CD 連携

### 6.1 CI でのテスト実行

```yaml
# .github/workflows/ci.yml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

### 6.2 テストスクリプト

```json
{
  "scripts": {
    "test": "vitest",
    "test:ci": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test"
  }
}
```

---

## 7. E2E テスト規約

### 7.1 Playwright 設定

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 2,
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
});
```

### 7.2 E2E テスト例

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('user can login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="submit"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-name"]')).toBeVisible();
  });
});
```

---

## 8. 禁止事項

- テストなしでのマージ（クリティカル機能）
- `test.skip` の放置（1週間以内に解決 or 削除）
- 本番データを使用したテスト
- 順序依存のテスト（各テストは独立）
- `any` 型の多用（型安全性を維持）

---

## 関連ドキュメント

- [コーディング規約](CODING-STANDARDS.md)
- [CI/CD規約](CI-CD.md)
- [Git ワークフロー](GIT-WORKFLOW.md)
