# コーディング規約

**バージョン**: 1.18.0
**更新日**: 2026-02-18

---

## 概要

本文書は、G.U.Corp プロジェクトにおけるコーディングの標準規約を定めます。

---

## 1. 基本原則

### 1.1 コード品質指針

| 原則 | 説明 |
|------|------|
| 可読性 | コードは書く時間より読む時間が長い。明確に書く |
| 単純性 | 最もシンプルな解決策を選ぶ。過度な抽象化を避ける |
| 一貫性 | プロジェクト内で統一されたスタイルを維持する |
| テスト容易性 | テストしやすい設計を心がける |

### 1.2 DRY / KISS / YAGNI

- **DRY** (Don't Repeat Yourself): 重複を避ける
- **KISS** (Keep It Simple, Stupid): シンプルに保つ
- **YAGNI** (You Aren't Gonna Need It): 必要になるまで作らない

---

## 2. TypeScript 規約

### 2.1 型定義

```typescript
// Good: 明示的な型定義
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// Good: 関数の引数と戻り値に型を指定
function createUser(data: CreateUserInput): Promise<User> {
  // ...
}

// Bad: any の使用
function processData(data: any): any { // 避ける
  // ...
}
```

### 2.2 型の使い分け

| 使用場面 | 推奨 | 避ける |
|----------|------|--------|
| オブジェクト | `interface` | `type` (継承が必要な場合) |
| Union型 | `type` | - |
| 関数型 | `type` | - |
| 不明な型 | `unknown` | `any` |

### 2.3 Null/Undefined 処理

```typescript
// Good: Optional chaining と Nullish coalescing
const userName = user?.profile?.name ?? 'Unknown';

// Good: 早期リターン
function processUser(user: User | null) {
  if (!user) {
    return null;
  }
  // user は User 型として扱える
  return user.name;
}
```

---

## 3. 命名規則

### 3.1 基本命名規則

| 対象 | 規則 | 例 |
|------|------|-----|
| 変数・関数 | camelCase | `userName`, `getUserById` |
| クラス・型 | PascalCase | `UserService`, `UserProfile` |
| 定数 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| ファイル | kebab-case | `user-service.ts` |
| React コンポーネント | PascalCase | `UserCard.tsx` |

### 3.2 命名のガイドライン

```typescript
// Good: 意味のある名前
const activeUsers = users.filter(u => u.isActive);
const maxRetryCount = 3;

// Bad: 不明確な名前
const data = users.filter(u => u.isActive); // data は不明確
const n = 3; // n の意味が不明
```

### 3.3 関数命名

| パターン | 用途 | 例 |
|----------|------|-----|
| `get*` | データ取得 | `getUser`, `getUserById` |
| `create*` | 新規作成 | `createUser` |
| `update*` | 更新 | `updateUser` |
| `delete*` | 削除 | `deleteUser` |
| `is*` / `has*` | Boolean判定 | `isActive`, `hasPermission` |
| `handle*` | イベントハンドラ | `handleClick`, `handleSubmit` |

---

## 4. ファイル構成

### 4.1 ディレクトリ構造

```text
src/
├── app/              # Next.js App Router
├── components/       # UI コンポーネント
│   ├── ui/          # 汎用コンポーネント
│   └── features/    # 機能別コンポーネント
├── lib/             # ユーティリティ・ヘルパー
├── hooks/           # カスタムフック
├── types/           # 型定義
├── constants/       # 定数
└── services/        # API クライアント・外部サービス
```

### 4.2 ファイル構成規則

| ファイル種別 | 配置 | 命名 |
|-------------|------|------|
| React コンポーネント | `components/` | `ComponentName.tsx` |
| カスタムフック | `hooks/` | `use-hook-name.ts` |
| ユーティリティ | `lib/` | `util-name.ts` |
| 型定義 | `types/` | `type-name.ts` |
| API クライアント | `services/` | `service-name.ts` |

---

## 5. React / Next.js 規約

### 5.1 コンポーネント構造

```typescript
// Good: 関数コンポーネント
interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
}

export function UserCard({ user, onEdit }: UserCardProps) {
  const handleEdit = () => {
    onEdit?.(user);
  };

  return (
    <div className="user-card">
      <h3>{user.name}</h3>
      <button onClick={handleEdit}>Edit</button>
    </div>
  );
}
```

### 5.2 フック使用規則

```typescript
// Good: カスタムフックで関心の分離
function useUserData(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchUser(userId)
      .then(setUser)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [userId]);

  return { user, loading, error };
}
```

### 5.3 Server Components vs Client Components

| 種別 | 使用場面 | 特徴 |
|------|----------|------|
| Server Component | データ取得、静的コンテンツ | デフォルト、'use server' 不要 |
| Client Component | インタラクティブUI | 'use client' 必須 |

---

## 6. エラーハンドリング

### 6.1 基本パターン

```typescript
// Good: Result 型パターン
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

async function fetchUser(id: string): Promise<Result<User>> {
  try {
    const user = await api.get(`/users/${id}`);
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
```

### 6.2 エラーメッセージ

```typescript
// Good: ユーザーフレンドリーなメッセージ
throw new Error('ユーザーが見つかりません');

// Bad: 技術的なメッセージのみ
throw new Error('USER_NOT_FOUND');
```

---

## 7. コメント規約

### 7.1 コメントの使い分け

| 種別 | 用途 | 例 |
|------|------|-----|
| JSDoc | 公開API、関数 | `/** @param userId ユーザーID */` |
| 単一行 | 複雑なロジックの説明 | `// 税率を適用` |
| 作業メモ | 未実装・改善予定 | `// 作業メモ: エラーハンドリング追加` |

### 7.2 JSDoc 例

```typescript
/**
 * ユーザーを ID で取得する
 * @param userId - ユーザーID
 * @returns ユーザー情報。見つからない場合は null
 * @throws {Error} API エラー時
 */
async function getUserById(userId: string): Promise<User | null> {
  // ...
}
```

---

## 8. 禁止事項

- `any` 型の使用（`unknown` を使用）
- `console.log` の本番コードへの残存
- マジックナンバー（定数化する）
- 深いネスト（3階層以上は早期リターンで解消）
- 巨大な関数（50行以上は分割を検討）
- 未使用のインポート・変数

---

## 9. Linting & Formatting

### 9.1 必須ツール

| ツール | 用途 |
|--------|------|
| ESLint | 静的解析 |
| Prettier | コードフォーマット |
| TypeScript | 型チェック |

### 9.2 推奨設定

```json
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "next/core-web-vitals"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error"
  }
}
```

---

## 関連ドキュメント

- [テスト規約](TESTING.md)
- [Git ワークフロー](GIT-WORKFLOW.md)
- [CI/CD規約](CI-CD.md)
