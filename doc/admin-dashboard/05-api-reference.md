# API Reference

## Server Actions

All server actions follow these conventions:

- **Location**: `src/actions/admin/`
- **Export**: Named export functions
- **Return Type**: `Promise<ActionResult>`
- **Auth**: All require admin session
- **Logging**: All mutations create audit logs

### Common Types

```typescript
type ActionResult =
  | { success: true; gameId?: number; questionId?: number }
  | { success: false; error: string };

type AdminSession = {
  userId: number;
  fid: string;
  username?: string;
  role: "ADMIN";
};
```

## Game Actions

### createGameAction

Create a new game.

**Module**: `src/actions/admin/games.ts`

```typescript
export async function createGameAction(
  _prevState: GameActionResult | null,
  formData: FormData
): Promise<GameActionResult>;
```

**Parameters**:

- `formData.get("title")`: string (min 3 chars)
- `formData.get("description")`: string | null
- `formData.get("theme")`: "FOOTBALL" | "MOVIES" | "ANIME" | "POLITICS" | "CRYPTO"
- `formData.get("coverUrl")`: string | null
- `formData.get("startsAt")`: ISO date string
- `formData.get("endsAt")`: ISO date string
- `formData.get("entryFee")`: number (≥ 0)
- `formData.get("prizePool")`: number (≥ 0)
- `formData.get("questionCount")`: number (≥ 1)
- `formData.get("roundDurationSec")`: number (≥ 5)
- `formData.get("maxPlayers")`: number (≥ 2)

**Returns**:

```typescript
// Success
{ success: true, gameId: 123 }

// Error
{ success: false, error: "Title must be at least 3 characters" }
```

**Side Effects**:

- Creates game in database
- Creates audit log
- Revalidates `/admin/games`
- Redirects to `/admin/games`

**Example**:

```tsx
import { useFormState } from "react-dom";
import { createGameAction } from "@/actions/admin/games";

function GameForm() {
  const [state, formAction] = useFormState(createGameAction, null);

  return (
    <form action={formAction}>
      <input name="title" required />
      {/* ... */}
      <button type="submit">Create</button>
      {state?.error && <p>{state.error}</p>}
    </form>
  );
}
```

---

### updateGameAction

Update an existing game.

**Module**: `src/actions/admin/games.ts`

```typescript
export async function updateGameAction(
  gameId: number,
  _prevState: GameActionResult | null,
  formData: FormData
): Promise<GameActionResult>;
```

**Parameters**:

- `gameId`: number (game ID to update)
- `formData`: Same as `createGameAction`

**Validation**:

- Game must exist
- Game status must be SCHEDULED

**Returns**: Same as `createGameAction`

**Side Effects**:

- Updates game in database
- Creates audit log
- Revalidates `/admin/games` and `/admin/games/[id]`
- Redirects to `/admin/games`

---

### startGameAction

Change game status to LIVE.

**Module**: `src/actions/admin/games.ts`

```typescript
export async function startGameAction(
  gameId: number
): Promise<GameActionResult>;
```

**Parameters**:

- `gameId`: number

**Validation**:

- Game must exist
- Status must be SCHEDULED
- Must have at least 1 question

**Returns**:

```typescript
// Success
{ success: true }

// Error
{ success: false, error: "Cannot start game without questions" }
```

**Side Effects**:

- Sets game status to LIVE
- Creates audit log
- Revalidates `/admin/games` and `/admin/games/[id]`

**Example**:

```tsx
"use client";

async function handleStart(gameId: number) {
  const result = await startGameAction(gameId);
  if (result.success) {
    notify.success("Game started!");
  } else {
    notify.error(result.error);
  }
}
```

---

### endGameAction

Change game status to ENDED.

**Module**: `src/actions/admin/games.ts`

```typescript
export async function endGameAction(gameId: number): Promise<GameActionResult>;
```

**Parameters**:

- `gameId`: number

**Validation**:

- Game must exist
- Status must be LIVE or SCHEDULED

**Returns**: Same as `startGameAction`

**Side Effects**:

- Sets game status to ENDED
- Creates audit log
- Revalidates `/admin/games` and `/admin/games/[id]`

---

### deleteGameAction

Delete a game and all related data.

**Module**: `src/actions/admin/games.ts`

```typescript
export async function deleteGameAction(gameId: number): Promise<void>;
```

**Parameters**:

- `gameId`: number

**Validation**:

- Game must exist

**Side Effects**:

- Deletes game (cascades to questions, tickets, players, answers, chats)
- Creates audit log
- Revalidates `/admin/games`
- Redirects to `/admin/games`

> [!CAUTION]
> This action is irreversible.

---

## Question Actions

### createQuestionAction

Add a question to a game.

**Module**: `src/actions/admin/questions.ts`

```typescript
export async function createQuestionAction(
  gameId: number,
  _prevState: QuestionActionResult | null,
  formData: FormData
): Promise<QuestionActionResult>;
```

**Parameters**:

- `gameId`: number
- `formData.get("content")`: string (min 5 chars)
- `formData.get("optionA")`: string (min 1 char)
- `formData.get("optionB")`: string (min 1 char)
- `formData.get("optionC")`: string (min 1 char)
- `formData.get("optionD")`: string (min 1 char)
- `formData.get("correctAnswer")`: "A" | "B" | "C" | "D"
- `formData.get("roundIndex")`: number (≥ 1)
- `formData.get("mediaUrl")`: string | null (optional)
- `formData.get("soundUrl")`: string | null (optional)
- `formData.get("durationSec")`: number (≥ 5, default 10)

**Returns**:

```typescript
// Success
{ success: true, questionId: 456 }

// Error
{ success: false, error: "Question content is required" }
```

**Side Effects**:

- Creates question in database
- Creates audit log
- Revalidates `/admin/games/[id]/questions`

**Example**:

```tsx
<form action={createQuestionAction.bind(null, gameId)}>
  <input name="content" placeholder="Question..." />
  <input name="optionA" placeholder="Option A" />
  <input name="optionB" placeholder="Option B" />
  <input name="optionC" placeholder="Option C" />
  <input name="optionD" placeholder="Option D" />
  <select name="correctAnswer">
    <option value="A">A</option>
    <option value="B">B</option>
    <option value="C">C</option>
    <option value="D">D</option>
  </select>
  <button type="submit">Add Question</button>
</form>
```

---

### deleteQuestionAction

Remove a question from a game.

**Module**: `src/actions/admin/questions.ts`

```typescript
export async function deleteQuestionAction(questionId: number): Promise<void>;
```

**Parameters**:

- `questionId`: number

**Validation**:

- Question must exist

**Side Effects**:

- Deletes question (cascades to answers)
- Creates audit log
- Revalidates question list
- Redirects back

---

## User Actions

### banUserAction

Ban a user from the platform.

**Module**: `src/actions/admin/users.ts`

```typescript
export async function banUserAction(userId: number): Promise<UserActionResult>;
```

**Parameters**:

- `userId`: number

**Validation**:

- User must exist
- User must not be an admin

**Returns**:

```typescript
{ success: true } | { success: false, error: string }
```

**Side Effects**:

- Sets user status to BANNED
- Creates audit log
- Revalidates `/admin/users` and `/admin/users/[id]`

---

### unbanUserAction

Restore user access.

**Module**: `src/actions/admin/users.ts`

```typescript
export async function unbanUserAction(
  userId: number
): Promise<UserActionResult>;
```

**Parameters**:

- `userId`: number

**Side Effects**:

- Sets user status to ACTIVE
- Creates audit log
- Revalidates user pages

---

### updateUserInviteQuotaAction

Adjust user's invite allowance.

**Module**: `src/actions/admin/users.ts`

```typescript
export async function updateUserInviteQuotaAction(
  userId: number,
  newQuota: number
): Promise<UserActionResult>;
```

**Parameters**:

- `userId`: number
- `newQuota`: number (≥ 0)

**Side Effects**:

- Updates invite quota
- Creates audit log
- Revalidates user pages

---

### promoteUserAction

Grant admin privileges to a user.

**Module**: `src/actions/admin/users.ts`

```typescript
export async function promoteUserAction(
  userId: number
): Promise<UserActionResult>;
```

**Parameters**:

- `userId`: number

**Validation**:

- User must exist
- User must not already be admin

**Side Effects**:

- Sets user role to ADMIN
- Creates audit log
- Revalidates user pages

> [!WARNING]
> This grants full dashboard access.

---

## Authentication Functions

### getAdminSession

Retrieve current admin session.

**Module**: `src/lib/admin-auth.ts`

```typescript
export async function getAdminSession(): Promise<AdminSession | null>;
```

**Returns**:

```typescript
{
  userId: number;
  fid: string;
  username?: string;
  role: "ADMIN";
} | null
```

**Usage**:

```tsx
// Server Component
export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return <div>Welcome {session.username}</div>;
}
```

---

### requireAdminSession

Enforce admin authentication.

**Module**: `src/lib/admin-auth.ts`

```typescript
export async function requireAdminSession(): Promise<{
  authenticated: boolean;
  session: AdminSession | null;
}>;
```

**Returns**:

```typescript
// Authenticated
{ authenticated: true, session: { userId, fid, username, role } }

// Not authenticated
{ authenticated: false, session: null }
```

**Usage**:

```typescript
export async function someAction() {
  const { authenticated, session } = await requireAdminSession();
  if (!authenticated) {
    return { success: false, error: "Unauthorized" };
  }

  // Proceed with action
}
```

---

## Upload API

### POST /api/upload

Generate auth token for Vercel Blob uploads.

**Endpoint**: `POST /api/upload`

**Authentication**: Admin session required (cookie)

**Request Body**:

```typescript
{
  pathname: string;       // File path in blob storage
  type: "blob-upload";    // Request type
  multipart?: boolean;    // For large files
}
```

**Response**:

```typescript
{
  url: string; // Upload URL
  token: string; // Auth token
}
```

**Allowed File Types**:

- `image/jpeg`
- `image/png`
- `image/gif`
- `audio/mpeg`
- `audio/wav`

**Token Payload**:

```typescript
{
  userId: number;
  username: string;
}
```

**Example** (via `@vercel/blob`):

```typescript
import { upload } from "@vercel/blob/client";

const blob = await upload(file.name, file, {
  access: "public",
  handleUploadUrl: "/api/upload",
});

console.log(blob.url); // https://...
```

---

## Audit Logging

### logAdminAction

Record admin actions for compliance.

**Module**: `src/lib/audit.ts`

```typescript
export async function logAdminAction(params: {
  adminId?: number;
  userId?: number;
  action: AdminAction;
  entityType: EntityType;
  entityId: number | string;
  details?: Record<string, any>;
}): Promise<void>;
```

**Parameters**:

- `adminId`: Admin user ID (optional, inferred from session)
- `userId`: For user-specific actions
- `action`: Action type enum
- `entityType`: Entity affected
- `entityId`: ID of affected entity
- `details`: Additional context (JSON)

**Action Types**:

```typescript
enum AdminAction {
  CREATE_GAME = "CREATE_GAME",
  UPDATE_GAME = "UPDATE_GAME",
  DELETE_GAME = "DELETE_GAME",
  START_GAME = "START_GAME",
  END_GAME = "END_GAME",
  CREATE_QUESTION = "CREATE_QUESTION",
  DELETE_QUESTION = "DELETE_QUESTION",
  BAN_USER = "BAN_USER",
  UNBAN_USER = "UNBAN_USER",
  PROMOTE_USER = "PROMOTE_USER",
  // ... etc
}
```

**Entity Types**:

```typescript
enum EntityType {
  GAME = "GAME",
  QUESTION = "QUESTION",
  USER = "USER",
  TICKET = "TICKET",
}
```

**Example**:

```typescript
await logAdminAction({
  adminId: session.userId,
  action: AdminAction.START_GAME,
  entityType: EntityType.GAME,
  entityId: gameId,
  details: { title: game.title, status: "LIVE" },
});
```

---

## Database Queries (via Prisma)

### Example: Fetch Games with Filters

```typescript
const games = await prisma.game.findMany({
  where: {
    title: { contains: searchQuery, mode: "insensitive" },
    status: filterStatus,
  },
  orderBy: [{ status: "asc" }, { startsAt: "desc" }],
  include: {
    _count: {
      select: {
        players: true,
        questions: true,
        tickets: true,
      },
    },
  },
});
```

### Example: Aggregate Statistics

```typescript
const stats = await Promise.all([
  prisma.user.count(),
  prisma.user.count({ where: { status: "ACTIVE" } }),
  prisma.game.count({ where: { status: "LIVE" } }),
  prisma.ticket.aggregate({
    where: { status: "PAID" },
    _sum: { amountUSDC: true },
  }),
]);
```

---

## Error Handling

All server actions follow this pattern:

```typescript
export async function someAction() {
  // 1. Validate auth
  const { authenticated, session } = await requireAdminSession();
  if (!authenticated) {
    return { success: false, error: "Unauthorized" };
  }

  // 2. Validate input
  const validation = schema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || "Invalid input",
    };
  }

  // 3. Database operation
  try {
    await prisma.model.create({ data });
    await logAdminAction({ ... });
    revalidatePath("/admin/...");
    return { success: true };
  } catch (error) {
    console.error("Action failed:", error);
    return { success: false, error: "Operation failed" };
  }
}
```

## Revalidation Strategy

After mutations, revalidate affected paths:

```typescript
// Single path
revalidatePath("/admin/games");

// Multiple paths
revalidatePath("/admin/games");
revalidatePath(`/admin/games/${gameId}`);
revalidatePath("/admin/analytics");
```

**When to revalidate**:

- Always after CREATE, UPDATE, DELETE
- Include detail pages if affected
- Include analytics if metrics changed

## Next Steps

- [Security Guide](./06-security.md)
- [Development Guide](./07-development.md)
