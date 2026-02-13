# User Profiles

> User profiles store personalized metadata for each authenticated user. Currently, profiles track the user's frequently used categories to power smart autocomplete suggestions in the task creation and editing flows. Profiles are stored at `/users/{userId}` in Firestore and managed via RTK Query endpoints.

## Overview

Each user has a single profile document that persists across sessions. The profile is auto-created on first login with an empty categories array. As the user creates tasks with new categories, those values are automatically appended to the profile. The SmartInput's autocomplete suggestions are powered exclusively by profile data -- there are no hardcoded defaults.

## Key Files

| File                        | Role                                                                                            |
| --------------------------- | ----------------------------------------------------------------------------------------------- |
| `src/store/profileApi.ts`   | RTK Query endpoints -- `getProfile`, `updateProfile`                                            |
| `src/store/api.ts`          | Central API slice with `'Profile'` cache tag                                                    |
| `src/lib/types.ts`          | `Profile` type definition                                                                       |
| `src/pages/HomePage.tsx`    | Fetches user profile, passes suggestions to form, auto-updates profile on task creation         |
| `src/components/settings/SettingsModal.tsx` | User interface for viewing and managing profile categories (add/delete)                |
| `src/App.tsx`               | Settings button in header opens `SettingsModal` when authenticated                              |
| `src/components/task-editor/SmartInput/SmartInput.tsx` | Accepts `suggestedCategories` prop, wires it to suggestion factory |
| `src/components/task-editor/SmartInput/suggestions/CategorySuggestion.ts` | Factory function returning profile categories only     |

## Profile Data Model

The `Profile` type is defined in `src/lib/types.ts`:

| Field        | Type       | Description                                            |
| ------------ | ---------- | ------------------------------------------------------ |
| `id`         | `string`   | User ID (Firebase Auth UID)                            |
| `categories` | `string[]` | Array of categories the user has created (in order of first use) |
| `createdAt`  | `number`   | Timestamp in milliseconds                              |
| `updatedAt`  | `number`   | Timestamp in milliseconds                              |

## How It Works

### Profile Lifecycle

1. **User signs in** -- Firebase Auth creates a session.
2. **HomePage mounts** -- `useGetProfileQuery(userId)` fetches the profile document.
3. **First login** -- If the document doesn't exist, `getProfile` auto-creates it with an empty `categories` array.
4. **User creates a task** -- `HomePage.handleAdd()` checks if the task contains a new category not already in the profile.
5. **Profile update** -- If a new category is detected, `updateProfile({ userId, categories: [...profile.categories, newCategory] })` is called to append it.
6. **Cache invalidation** -- The mutation invalidates the `Profile:{userId}` cache tag, triggering a refetch and updating suggestions immediately.

### Profile Creation (Auto-Generated Default)

When `getProfile` query runs and the Firestore document does not exist, the endpoint creates a default profile:

```ts
const profile: Profile = {
  id: userId,
  categories: [],
  createdAt: dayjs().valueOf(),
  updatedAt: dayjs().valueOf(),
}
await setDoc(profileDoc(userId), profile)
return { data: profile }
```

This happens silently on first login. The user is never prompted to create a profile -- it exists automatically.

### Profile Updates

#### Automatic Updates (Append-Only)

When a user creates a task, `HomePage.handleAdd()` compares the task's category against the current profile:

```ts
const newCategory =
  data.category && !profile.categories.includes(data.category)
    ? data.category
    : null

if (newCategory) {
  updateProfile({
    userId,
    categories: [...profile.categories, newCategory],
  })
}
```

This is an **append-only** operation. New categories are automatically added to the profile as they are used in tasks.

#### Manual Updates (Settings Modal)

Users can manually manage their profile categories through the **Settings Modal** (`src/components/settings/SettingsModal.tsx`), accessible via a gear icon button in the app header (visible when authenticated).

**Settings Modal features:**

- **View categories** -- Lists all categories from the user's profile
- **Add categories** -- Text input + Add button or Enter key to append new categories
- **Delete categories** -- Trash icon next to each category removes it from the profile
- **Empty state** -- Shows "No categories yet" when the profile has no categories

**Immediate updates:** Each add or delete action calls `updateProfile` immediately (no batch save). This ensures changes are persisted and reflected in autocomplete suggestions right away. Duplicate categories are rejected client-side before calling the mutation.

**Tags are not editable** in the Settings Modal -- only categories can be managed. This is a deliberate scope limitation.

The `updateProfile` mutation uses `updateDoc` (not `setDoc`), so only the specified fields are patched. It also auto-sets `updatedAt` to the current timestamp.

## Suggestion Flow

### Data Flow: Profile → SmartInput → Tiptap

1. **HomePage fetches profile** -- `useGetProfileQuery(userId)` returns the `Profile` object.
2. **HomePage passes suggestions down** -- `<TaskCreationForm suggestedCategories={profile?.categories} />`
3. **TaskCreationForm forwards props** -- `<SmartInput suggestedCategories={suggestedCategories} />`
4. **SmartInput stores props in a ref** -- `categoriesRef.current = suggestedCategories` inside a `useEffect` hook. This ensures fresh data is available to Tiptap's lazy evaluation even though extensions are created once.
5. **Suggestion factory reads from ref** -- `createCategorySuggestion(() => categoriesRef.current)` creates an extension config with a `getItems` function that reads `ref.current` when the user types.
6. **Extension plugin calls `items()`** -- When the user types `@`, the suggestion plugin calls the `items()` function with the current query string. The factory filters the profile categories by prefix match. If the profile has no matching items, the dropdown does not render.

### Suggestion Factory (CategorySuggestion)

`CategorySuggestion.ts` exports a **factory function** that accepts a `getItems()` callback. Suggestions come exclusively from the user's profile -- there are no hardcoded default lists.

```ts
export function createCategorySuggestion(getItems: () => string[]) {
  return {
    char: '@',
    items: ({ query }) => {
      return getItems()
        .filter((t) => t.toLowerCase().startsWith(query.toLowerCase()))
        .slice(0, 8)
    },
    // ...
  }
}
```

The factory receives `() => categoriesRef.current` from SmartInput, so it can read the latest prop value even though the Tiptap extension is created only once during `useEditor()` initialization. The `items()` function filters profile categories by prefix match (case-insensitive) and limits results to 8. If the profile has no matching items, `SuggestionDropdown` returns `null` and nothing renders.

This means a brand-new user with an empty profile will see no autocomplete suggestions. Suggestions build up organically as the user creates tasks with categories, which are automatically saved to the profile (see [Profile Updates](#profile-updates-append-only) below).

### Why Refs Instead of Dependency Arrays

The Tiptap editor is created once in `useEditor()` with an empty dependency array. Extensions are initialized at that moment, and their closures capture the initial prop values. To avoid stale closures, SmartInput uses a **ref + effect** pattern:

```ts
const categoriesRef = useRef(suggestedCategories)

useEffect(() => {
  categoriesRef.current = suggestedCategories
}, [suggestedCategories])

// Extension creation -- reads ref lazily, not at creation time
createCategorySuggestionExtension(() => categoriesRef.current)
```

The ref object is stable across renders, but `.current` is updated in the effect. The `items()` callback reads `.current` only when the user types, so it always sees the latest profile data without re-creating the entire editor.

## RTK Query Endpoints

All endpoints are defined in `src/store/profileApi.ts` using `api.injectEndpoints()`. See [State Management](./state-management.md) for the overall RTK Query architecture.

### `getProfile`

**Type:** Query

**Parameters:** `userId: string`

**Returns:** `Profile`

**Firestore Operation:**
1. Attempts `getDoc(doc(db, 'users', userId))`
2. If document exists, returns it as `Profile`
3. If document does not exist, creates a default profile with empty arrays and returns it

**Cache Tags:** Provides `{ type: 'Profile', id: userId }`

**Usage:**
```ts
const { data: profile, isLoading } = useGetProfileQuery(userId)
```

**Auto-Creation:** This query is **not** idempotent. The first call creates the document if it doesn't exist. Subsequent calls read the existing document. This ensures every user has a profile without requiring explicit setup.

### `updateProfile`

**Type:** Mutation

**Parameters:** `{ userId: string } & Partial<Omit<Profile, 'id' | 'createdAt'>>`

**Returns:** `void`

**Firestore Operation:**
1. Calls `updateDoc(doc(db, 'users', userId), { ...patch, updatedAt: dayjs().valueOf() })`
2. Auto-sets `updatedAt` field to current timestamp
3. Only patches the fields provided -- does not overwrite the entire document

**Cache Tags:** Invalidates `{ type: 'Profile', id: userId }`

**Usage:**
```ts
const [updateProfile] = useUpdateProfileMutation()

updateProfile({
  userId,
  categories: [...profile.categories, 'new-category'],
})
```

**Idempotency:** Safe to call with the same data multiple times. Firestore `updateDoc` is idempotent. However, `updatedAt` will be updated on every call even if no other fields change.

## Firestore Schema

### Collection Path

- **Profiles:** `/users/{userId}` (top-level user document, not a subcollection)

Each user ID corresponds to a Firebase Auth UID. The profile document lives at the root `users` collection, not under a subcollection. This is different from tasks, which are stored at `/users/{userId}/tasks/{taskId}`.

### Security Rules

Profile documents should be readable and writable only by the authenticated user who owns them:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Edge Cases and Important Notes

- **Profile is auto-created on first query.** There is no "create profile" mutation. The `getProfile` query creates the document if it doesn't exist (with an empty `categories` array). This is intentional -- users should never see an error or empty state due to a missing profile.
- **Automatic append-only behavior.** When a user creates a task with a new category, that value is automatically appended to the profile for future autocomplete suggestions. This happens after the task is written to Firestore.
- **Manual category management.** Users can add and delete categories via the Settings Modal in the app header. Each action is persisted immediately (no batch save).
- **No deduplication on update.** `HomePage.handleAdd()` checks for new values before calling `updateProfile`, and the Settings Modal checks for duplicates before allowing add operations, but the `updateProfile` mutation itself does not deduplicate. If these checks are bypassed, duplicates could appear in the array.
- **No ordering or frequency tracking.** Categories are stored in order of first use. The app does not track how often each category is used, so suggestions appear in profile array order (insertion order).
- **Empty profile means no suggestions.** Since there are no hardcoded defaults, a new user with an empty profile will see no autocomplete suggestions until they create tasks with categories or add them manually via the Settings Modal.
- **Profile is user-scoped, not workspace-scoped.** There is no concept of shared workspaces or teams. Each user has their own isolated profile.
- **Ref pattern avoids editor recreation.** The `categoriesRef` pattern is required because Tiptap extensions are created once during `useEditor()` initialization. Re-creating the editor on every profile update would lose focus and cursor position.
- **Suggestions are prefix-filtered.** The `items()` function filters by `query.toLowerCase().startsWith(...)`. Substring matching is not supported. Typing `@wo` will match `work`, but `@ork` will not.
- **Limit of 8 suggestions.** The category dropdown is hard-limited to 8 results via `.slice(0, 8)`. This keeps the dropdown compact and fast.
- **Profile updates happen after task creation.** The profile is updated after the task is successfully written to Firestore, not optimistically. If the task write fails, the profile is not updated.
- **`useGetProfileQuery` is called in two places.** The profile query is called by `HomePage` (for autocomplete suggestions) and `SettingsModal` (for viewing/editing categories). RTK Query deduplicates the request and serves both from the same cache.

## Related Documentation

- [State Management](./state-management.md) -- RTK Query architecture, endpoint injection pattern, Firestore integration
- [Home Page](./home-page.md) -- SmartInput, TaskCreationForm, and how suggestions are used during task creation
- [Firebase Auth](./firebase-auth.md) -- `AuthProvider`, `useAuth()` hook, user ID source
