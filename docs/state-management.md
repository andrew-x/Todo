# State Management

> The app uses Redux Toolkit (RTK) with RTK Query for server-state management. The store is configured once in `src/store/`, and feature-specific API endpoints are injected from `*Api.ts` files that also live in `src/store/` using the `injectEndpoints` pattern. Firestore is the backend, so RTK Query uses `fakeBaseQuery` with custom `queryFn` functions instead of HTTP fetching.

## Overview

State management is split into two concerns:

- **Server state** (remote data from Firestore) -- handled by RTK Query. This covers fetching, caching, invalidation, and optimistic updates for todos and other Firestore-backed data.
- **Client state** (UI state, ephemeral form state) -- handled locally in components with React state. Redux slices can be added later if shared client state is needed.

RTK Query was chosen over a raw Firestore SDK approach because it provides a normalized cache, automatic refetching, tag-based invalidation, and loading/error state management out of the box.

## File Locations

| File                      | Purpose                                                            |
| ------------------------- | ------------------------------------------------------------------ |
| `src/store/api.ts`        | Central RTK Query API slice (`createApi` call)                     |
| `src/store/store.ts`      | Redux store configuration, type exports                            |
| `src/store/hooks.ts`      | Typed `useAppDispatch` and `useAppSelector` hooks                  |
| `src/store/todosApi.ts`   | Todo/Task endpoints (queries + mutations via `injectEndpoints`)    |
| `src/store/profileApi.ts` | User Profile endpoints (queries + mutations via `injectEndpoints`) |
| `src/main.tsx`            | `<Provider store={store}>` wrapping the app                        |

Feature endpoint files follow the convention `*Api.ts` and live in `src/store/` alongside the core store files (e.g., `src/store/todosApi.ts`). This keeps all app state -- store config, API slice, and endpoints -- in one place.

## Dependencies

- `@reduxjs/toolkit` ^2.11.2
- `react-redux` ^9.2.0

## How It Works

### Store Setup

The store is configured in `src/store/store.ts` with `configureStore`:

```ts
export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
})

setupListeners(store.dispatch)
```

Key details:

1. The API slice's auto-generated reducer is mounted at `api.reducerPath` (defaults to `"api"`).
2. The API middleware is appended to the default middleware chain. This middleware manages cache lifetimes, polling, and `setupListeners` behavior.
3. `setupListeners(store.dispatch)` enables automatic refetching when the browser tab regains focus or the network reconnects (`refetchOnFocus` / `refetchOnReconnect`).
4. `RootState` and `AppDispatch` types are derived from the store and exported for use in typed hooks.

### Provider

In `src/main.tsx`, the Redux `<Provider>` wraps `<App />` so the store is available to all components:

```tsx
<StrictMode>
  <Provider store={store}>
    <App />
  </Provider>
</StrictMode>
```

The provider sits outside the router so store access is available everywhere in the component tree.

### Typed Hooks

`src/store/hooks.ts` exports pre-typed versions of the standard Redux hooks using the `.withTypes()` pattern:

```ts
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
```

Always import these typed hooks instead of the base `useDispatch` / `useSelector` from `react-redux`. This avoids repeating type annotations at every call site.

## RTK Query Architecture

### Central API Slice

`src/store/api.ts` defines a single `createApi` instance:

```ts
export const api = createApi({
  baseQuery: fakeBaseQuery<FirestoreError>(),
  tagTypes: ['Task'],
  endpoints: () => ({}),
})
```

The file also exports a `FirestoreError` type and a `toFirestoreError(e)` helper that normalizes Firebase errors into `{ code, message }` objects. Endpoint `queryFn` functions use this helper in their catch blocks.

- **`fakeBaseQuery<FirestoreError>()`** -- Used because the app talks to Firestore directly (not via HTTP). Each endpoint defines its own `queryFn` that calls Firestore SDK methods. The generic parameter types the error shape.
- **`tagTypes: ['Task', 'Profile']`** -- Cache tags registered here. Tags are added as features define them.
- **`endpoints: () => ({})`** -- Empty initially. Endpoints are injected per feature from separate files in `src/store/`.

There is exactly one `createApi` call in the entire app. This is intentional -- RTK Query's architecture requires a single API slice so that cache invalidation and tag relationships work across features.

### Inject Endpoints Pattern

Feature-specific endpoints are defined in separate `*Api.ts` files within `src/store/` using `api.injectEndpoints()`. This keeps the central `api.ts` minimal while co-locating all state management logic in a single directory.

### Connecting to Firestore (`fakeBaseQuery` + `queryFn`)

Since Firestore is not an HTTP API, each endpoint uses a `queryFn` instead of relying on `baseQuery`. The `fakeBaseQuery()` base query exists only to satisfy RTK Query's type system -- it is never actually called.

Inside `queryFn`, you call Firestore SDK methods directly and return the result in RTK Query's expected format:

- **Success:** `{ data: <result> }`
- **Error:** `{ error: <error details> }`

## How to Add New Endpoints

Follow this process when adding a new feature's data layer:

### 1. Add Tag Types

If your feature introduces new cache tags, add them to the `tagTypes` array in `src/store/api.ts`:

```ts
export const api = createApi({
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Task', 'Profile'], // add your tag here
  endpoints: () => ({}),
})
```

### 2. Create a Feature API File

Create a `*Api.ts` file in `src/store/`. For example, `src/store/todosApi.ts`:

```ts
import { collection, doc, getDocs, setDoc } from 'firebase/firestore'

import { db } from '@/lib/firebase'
import { api, toFirestoreError } from '@/store/api'

interface Todo {
  id: string
  title: string
  completed: boolean
}

const todosApi = api.injectEndpoints({
  endpoints: (build) => ({
    getTodos: build.query<Todo[], string>({
      queryFn: async (userId) => {
        try {
          const snap = await getDocs(collection(db, 'users', userId, 'todos'))
          const todos = snap.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as Todo,
          )
          return { data: todos }
        } catch (e) {
          return { error: toFirestoreError(e) }
        }
      },
      providesTags: ['Task'],
    }),

    addTodo: build.mutation<Todo, { userId: string; title: string }>({
      queryFn: async ({ userId, title }) => {
        try {
          const ref = doc(collection(db, 'users', userId, 'todos'))
          const todo = { id: ref.id, title, completed: false }
          await setDoc(ref, todo)
          return { data: todo }
        } catch (e) {
          return { error: toFirestoreError(e) }
        }
      },
      invalidatesTags: ['Task'],
    }),
  }),
})

export const { useGetTodosQuery, useAddTodoMutation } = todosApi
```

### 3. Use in Components

Import the auto-generated hooks in your components:

```tsx
import { useAddTodoMutation, useGetTodosQuery } from '@/store/todosApi'

function TodoList() {
  const { data: todos, isLoading, error } = useGetTodosQuery()
  const [addTodo] = useAddTodoMutation()

  // ...
}
```

### Conventions

- **One `*Api.ts` file per feature in `src/store/`** (e.g., `src/store/todosApi.ts`). All endpoint files live alongside the store config, not with feature components.
- **Export only the generated hooks** from the API file. Components should use hooks, not dispatch actions directly.
- **Tag types are global.** Always register new tags in the central `src/store/api.ts` file so they are available for cross-feature invalidation.
- **Error handling in `queryFn`.** Always wrap Firestore calls in try/catch and use the `toFirestoreError(e)` helper from `@/store/api` to normalize the error. Return `{ error: toFirestoreError(e) }` on failure. Never let exceptions propagate.
- **No additional Redux slices** unless there is shared client-side state that cannot be handled by component state or RTK Query's cache.

## Edge Cases and Important Notes

- **Optimistic updates.** The `batchUpdateTasks` mutation in `src/store/todosApi.ts` uses `onQueryStarted` to optimistically patch the `listActiveTasks` cache before the Firestore write completes. On failure, the patch is rolled back via `patchResult.undo`. This is the pattern to follow for any future mutations that need instant UI feedback.
- **`fakeBaseQuery` is never called.** It exists solely for type satisfaction. All data fetching happens inside `queryFn` functions.
- **`setupListeners` enables refetch behaviors.** Endpoints can opt into `refetchOnFocus` and `refetchOnReconnect` because `setupListeners` is configured in the store. These are not enabled by default per-endpoint -- they must be passed as options to the hook (e.g., `useGetTodosQuery(undefined, { refetchOnFocus: true })`).
- **Firestore real-time listeners.** RTK Query's `queryFn` is request-based. For real-time Firestore subscriptions (`onSnapshot`), use RTK Query's streaming `onCacheEntryAdded` lifecycle instead of `queryFn`. This is not yet implemented but is the recommended pattern when needed.
- **No HTTP layer.** The app has no REST or GraphQL API. All server communication goes through Firestore SDK calls within `queryFn`.

## Related Documentation

- [Home Page](./home-page.md) -- Task management UI that consumes RTK Query hooks
- [User Profiles](./user-profiles.md) -- Profile data model and RTK Query endpoints for autocomplete suggestions
- [Design System](./design-system.md) -- reusable UI components
- [Routing](./routing.md) -- React Router setup and route table
