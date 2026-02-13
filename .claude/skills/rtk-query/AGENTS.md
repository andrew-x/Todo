# RTK Query Best Practices

**Version 1.0.0**
February 2026

> **Note:**
> This document is for agents and LLMs to follow when writing, reviewing,
> or refactoring RTK Query code in this project. Humans may also find it
> useful, but guidance here is optimized for automation and consistency
> by AI-assisted workflows.

---

## Project Context

- **RTK version:** `@reduxjs/toolkit@^2.11.2`, `react-redux@^9.2.0`
- **Data layer:** Firebase Firestore (no HTTP API)
- **Base query:** `fakeBaseQuery()` — all endpoints use `queryFn`
- **Store:** `src/store/store.ts`
- **API slice:** `src/store/api.ts`
- **Typed hooks:** `src/store/hooks.ts`

---

## Table of Contents

1. [Architecture](#1-architecture)
2. [queryFn Patterns](#2-queryfn-patterns)
3. [Cache Invalidation & Tags](#3-cache-invalidation--tags)
4. [Mutations](#4-mutations)
5. [Streaming & Realtime](#5-streaming--realtime)
6. [React Hooks](#6-react-hooks)
7. [TypeScript Patterns](#7-typescript-patterns)
8. [Performance](#8-performance)
9. [Common Pitfalls](#9-common-pitfalls)

---

## 1. Architecture

### 1.1 Single API Slice

Tags only work within the same API slice. Never create multiple `createApi` calls.

**Incorrect (separate API slices):**

```typescript
// BAD — cross-slice tag invalidation will NOT work
const todosApi = createApi({ reducerPath: 'todosApi', ... })
const usersApi = createApi({ reducerPath: 'usersApi', ... })
```

**Correct (one slice, inject per feature):**

```typescript
// src/store/api.ts — single createApi
export const api = createApi({
  baseQuery: fakeBaseQuery<FirestoreError>(),
  tagTypes: ['Todo', 'User'],
  endpoints: () => ({}),
})

// src/store/todosApi.ts — inject endpoints
const todosApi = api.injectEndpoints({
  endpoints: (build) => ({ ... }),
})
export const { useGetTodosQuery } = todosApi
```

### 1.2 File Organization

Place endpoint files in `src/store/` alongside the base API slice:

```
src/store/todosApi.ts    # Todo endpoints
src/store/authApi.ts     # Auth endpoints
```

Export hooks from the injected API, not the base API.

### 1.3 Store Setup

The store is already configured correctly. When adding non-API reducers, add them alongside:

```typescript
export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    ui: uiReducer, // additional slices go here
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
})
```

---

## 2. queryFn Patterns

### 2.1 Never Throw in queryFn

`queryFn` must always return `{ data }` or `{ error }`. Throwing causes unhandled promise rejections.

**Incorrect (throwing):**

```typescript
queryFn: async (id) => {
  const snap = await getDoc(doc(db, 'todos', id)) // can throw!
  return { data: { id: snap.id, ...snap.data() } as Todo }
}
```

**Correct (catch and return error):**

```typescript
queryFn: async (id) => {
  try {
    const snap = await getDoc(doc(db, 'todos', id))
    if (!snap.exists()) {
      return { error: { code: 'not-found', message: `Todo ${id} not found` } }
    }
    return { data: { id: snap.id, ...snap.data() } as Todo }
  } catch (e) {
    const err = e as FirebaseError
    return { error: { code: err.code, message: err.message } }
  }
}
```

### 2.2 Type the Error with fakeBaseQuery

Pass your error type as a generic so all endpoints enforce the same error shape:

```typescript
interface FirestoreError {
  code: string
  message: string
}

export const api = createApi({
  baseQuery: fakeBaseQuery<FirestoreError>(),
  ...
})
```

### 2.3 Error Conversion Helper

Create a reusable helper for Firestore errors:

```typescript
import type { FirebaseError } from 'firebase/app'

function toFirestoreError(e: unknown): FirestoreError {
  const err = e as FirebaseError
  return { code: err.code, message: err.message }
}
```

### 2.4 Don't Use query with fakeBaseQuery

`query` builds a request for `baseQuery`. Since `fakeBaseQuery` is a no-op, `query` does nothing. Always use `queryFn`.

---

## 3. Cache Invalidation & Tags

### 3.1 The LIST ID Pattern

Use a synthetic `'LIST'` tag ID to represent "the collection of all items":

```typescript
providesTags: (result) =>
  result
    ? [
        ...result.map(({ id }) => ({ type: 'Todo' as const, id })),
        { type: 'Todo', id: 'LIST' },
      ]
    : [{ type: 'Todo', id: 'LIST' }],
```

Then invalidate granularly:

| Operation   | Invalidates                                                                |
| ----------- | -------------------------------------------------------------------------- |
| Add item    | `{ type: 'Todo', id: 'LIST' }`                                             |
| Update item | `{ type: 'Todo', id: specificId }`                                         |
| Delete item | Both `{ type: 'Todo', id: specificId }` and `{ type: 'Todo', id: 'LIST' }` |

### 3.2 Guard Undefined in providesTags

If the query errored, `result` is `undefined`. Always check:

```typescript
// WRONG — will crash on error
providesTags: (result) => result.map(...)

// CORRECT — guard undefined
providesTags: (result) =>
  result
    ? [...result.map(({ id }) => ({ type: 'Todo' as const, id })), { type: 'Todo', id: 'LIST' }]
    : [{ type: 'Todo', id: 'LIST' }]
```

### 3.3 providesList Helper

Reduce boilerplate with a reusable helper:

```typescript
import type { TagDescription } from '@reduxjs/toolkit/query'

function providesList<
  R extends { id: string | number }[],
  T extends string,
>(result: R | undefined, tagType: T): TagDescription<T>[] {
  return result
    ? [
        { type: tagType, id: 'LIST' },
        ...result.map(({ id }) => ({ type: tagType, id })),
      ]
    : [{ type: tagType, id: 'LIST' }]
}

// Usage:
providesTags: (result) => providesList(result, 'Todo'),
```

### 3.4 keepUnusedDataFor

Controls cache lifetime (seconds) after all subscribers unmount. Default is 60s.

```typescript
// Global default
export const api = createApi({
  keepUnusedDataFor: 30,
  ...
})

// Per-endpoint override
getTodos: build.query<Todo[], void>({
  keepUnusedDataFor: 300,  // 5 minutes
  ...
})
```

For streaming queries with `onCacheEntryAdded`, consider a large value to keep the listener alive across navigations.

---

## 4. Mutations

### 4.1 Always .unwrap() for Try/Catch

Without `.unwrap()`, the trigger returns `{ data }` or `{ error }` — it never rejects.

```typescript
const [addTodo] = useAddTodoMutation()

// WRONG — catch never fires
try {
  const result = await addTodo(newTodo)
} catch (err) {
  /* unreachable */
}

// CORRECT — .unwrap() converts to normal Promise
try {
  const result = await addTodo(newTodo).unwrap()
} catch (err) {
  // err is the rejected error
}
```

### 4.2 Optimistic Updates

Update cache immediately, roll back on failure:

```typescript
updateTodo: build.mutation<void, Pick<Todo, 'id'> & Partial<Todo>>({
  queryFn: async ({ id, ...patch }) => {
    try {
      await updateDoc(doc(db, 'todos', id), patch)
      return { data: undefined }
    } catch (e) {
      return { error: toFirestoreError(e) }
    }
  },
  async onQueryStarted({ id, ...patch }, { dispatch, queryFulfilled }) {
    const patchResult = dispatch(
      api.util.updateQueryData('getTodos', userId, (draft) => {
        const todo = draft.find((t) => t.id === id)
        if (todo) Object.assign(todo, patch)
      }),
    )
    queryFulfilled.catch(patchResult.undo)
  },
}),
```

### 4.3 Pessimistic Updates

Wait for server confirmation, then update cache:

```typescript
addTodo: build.mutation<Todo, Omit<Todo, 'id'>>({
  queryFn: async (newTodo) => { ... },
  async onQueryStarted(_, { dispatch, queryFulfilled }) {
    try {
      const { data: created } = await queryFulfilled
      dispatch(
        api.util.updateQueryData('getTodos', userId, (draft) => {
          draft.push(created)
        }),
      )
    } catch {
      // Mutation failed — no cache update
    }
  },
}),
```

### 4.4 updateQueryData Arg Matching

The `arg` parameter must exactly match the argument the query was called with:

```typescript
// If component calls useGetTodosQuery('user123'):
api.util.updateQueryData('getTodos', 'user123', (draft) => { ... })  // works
api.util.updateQueryData('getTodos', undefined, (draft) => { ... })  // does nothing
```

---

## 5. Streaming & Realtime

### 5.1 Firestore onSnapshot Pattern

Use `onCacheEntryAdded` to establish a long-lived Firestore listener:

```typescript
getTodos: build.query<Todo[], string>({
  queryFn: () => ({ data: [] }),  // initial empty data

  async onCacheEntryAdded(
    userId,
    { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
  ) {
    let unsubscribe: (() => void) | undefined
    try {
      await cacheDataLoaded
      const q = query(
        collection(db, 'todos'),
        where('userId', '==', userId),
      )
      unsubscribe = onSnapshot(q, (snapshot) => {
        updateCachedData((draft) => {
          draft.length = 0
          snapshot.docs.forEach((d) => {
            draft.push({ id: d.id, ...d.data() } as Todo)
          })
        })
      })
    } catch {
      // cacheDataLoaded rejected
    }
    await cacheEntryRemoved
    unsubscribe?.()
  },

  providesTags: (result) => providesList(result, 'Todo'),
}),
```

### 5.2 Lifecycle Details

| Callback            | When it fires                                       |
| ------------------- | --------------------------------------------------- |
| `cacheDataLoaded`   | After initial `queryFn` result enters cache         |
| `updateCachedData`  | Immer-powered — mutate draft, RTK diffs and patches |
| `cacheEntryRemoved` | All subscribers gone + `keepUnusedDataFor` expired  |

### 5.3 Always Clean Up Listeners

Always `await cacheEntryRemoved` and call your unsubscribe function. Wrap in try/catch so cleanup runs even if `cacheDataLoaded` rejects.

### 5.4 onCacheEntryAdded Does Not Fire on Cache Hits

The lifecycle only runs when a **new** cache entry is created. If data is already cached and another component subscribes, it does not re-run — the original listener is still active.

### 5.5 Streaming + Mutations Interaction

With `onSnapshot`, Firestore mutations automatically trigger the listener. You may not need `invalidatesTags` at all. However, optimistic updates via `onQueryStarted` still help for instant UI feedback before the listener fires.

---

## 6. React Hooks

### 6.1 isLoading vs isFetching

| Flag         | Meaning                                           |
| ------------ | ------------------------------------------------- |
| `isLoading`  | First load only — no cached data exists yet       |
| `isFetching` | Any active request (including refetches, polling) |

Show a loading skeleton: use `isLoading`.
Show a subtle refetch indicator: use `isFetching && !isLoading`.

### 6.2 skipToken Over skip Option

`skipToken` provides better TypeScript inference:

```typescript
import { skipToken } from '@reduxjs/toolkit/query'

// PREFERRED — type-safe
const { data } = useGetTodosQuery(userId ?? skipToken)

// ALSO WORKS but less type-safe
const { data } = useGetTodosQuery(userId!, { skip: !userId })
```

### 6.3 Conditional / Dependent Queries

```typescript
function TodoDetails({ userId }: { userId: string }) {
  const { data: user } = useGetUserQuery(userId)
  const { data: todos } = useGetTodosQuery(user?.projectId ?? skipToken)
}
```

### 6.4 Polling

```typescript
const { data } = useGetTodosQuery(userId, {
  pollingInterval: 30000,
  skipPollingIfUnfocused: true,
})
```

### 6.5 refetchOnMountOrArgChange

```typescript
const { data } = useGetTodosQuery(userId, {
  refetchOnMountOrArgChange: 30, // refetch if cached data > 30s old
})
```

---

## 7. TypeScript Patterns

### 7.1 Endpoint Type Signatures

```typescript
// build.query<ResultType, ArgType>
getTodos: build.query<Todo[], string>({ ... })       // takes userId string
getTodo:  build.query<Todo, string>({ ... })          // takes todoId string
getAllTodos: build.query<Todo[], void>({ ... })        // no argument

// build.mutation<ResultType, ArgType>
addTodo:    build.mutation<Todo, Omit<Todo, 'id'>>({ ... })
updateTodo: build.mutation<void, Pick<Todo, 'id'> & Partial<Todo>>({ ... })
deleteTodo: build.mutation<void, string>({ ... })
```

### 7.2 Auto-Generated Hooks

Hooks are fully typed from the endpoint definitions — no manual typing needed:

```typescript
const todosApi = api.injectEndpoints({ ... })
export const {
  useGetTodosQuery,       // (arg: string, options?) => UseQueryResult<Todo[]>
  useAddTodoMutation,     // () => [trigger, result]
  useUpdateTodoMutation,
  useDeleteTodoMutation,
} = todosApi
```

### 7.3 Typed Store Hooks

Use the pre-built typed hooks from `src/store/hooks.ts` (`.withTypes()` pattern):

```typescript
import { useAppDispatch, useAppSelector } from '@/store/hooks'
```

---

## 8. Performance

### 8.1 selectFromResult for Derived Data

Subscribe only to the data you need to prevent unnecessary re-renders:

```typescript
const { todoCount } = useGetTodosQuery(userId, {
  selectFromResult: ({ data }) => ({
    todoCount: data?.length ?? 0,
  }),
})
```

### 8.2 Memoize Array/Object Returns in selectFromResult

Returning `.filter()` creates a new array every render, defeating memoization:

```typescript
import { createSelector } from '@reduxjs/toolkit'

// BAD — new array reference every time
selectFromResult: ({ data }) => ({
  completed: data?.filter((t) => t.completed) ?? [],
})

// GOOD — memoized selector
const selectCompleted = createSelector(
  (res: { data?: Todo[] }) => res.data,
  (data) => data?.filter((t) => t.completed) ?? [],
)

selectFromResult: (result) => ({
  completed: selectCompleted(result),
})
```

### 8.3 Structural Sharing

RTK Query 2.x uses structural sharing by default — unchanged parts of the result keep the same reference. This reduces unnecessary re-renders even without `selectFromResult`.

### 8.4 Destructure Only What You Need

```typescript
// OK but subscribes to all status changes
const result = useGetTodosQuery(userId)

// BETTER
const { data: todos, isLoading } = useGetTodosQuery(userId)
```

---

## 9. Common Pitfalls

### 9.1 Multiple API Slices

Tags only invalidate within the same slice. Use one `createApi` + `injectEndpoints`.

### 9.2 Throwing in queryFn

Always wrap in try/catch, return `{ error }`. Never let exceptions propagate.

### 9.3 Forgetting undefined Guard in providesTags

`result` is `undefined` on error. Always use a ternary.

### 9.4 query vs queryFn with fakeBaseQuery

`query` does nothing with `fakeBaseQuery`. Always use `queryFn`.

### 9.5 Missing .unwrap() on Mutations

Without `.unwrap()`, the mutation trigger never rejects — your catch block is dead code.

### 9.6 New References in selectFromResult

Returning `filter()` / `map()` creates new arrays. Use `createSelector`.

### 9.7 onCacheEntryAdded Cache Hit

The lifecycle only fires on new cache entries, not on re-subscriptions.

### 9.8 Missing Listener Cleanup

Always `await cacheEntryRemoved` then call `unsubscribe()`. Wrap setup in try/catch.

### 9.9 updateQueryData Arg Mismatch

The arg must exactly match what the query was called with. No fuzzy matching.

### 9.10 Confusing isLoading and isFetching

`isLoading` = first load only. `isFetching` = any active request.

---

## References

- [RTK Query — Customizing Queries](https://redux-toolkit.js.org/rtk-query/usage/customizing-queries)
- [RTK Query — Automated Re-fetching](https://redux-toolkit.js.org/rtk-query/usage/automated-refetching)
- [RTK Query — Streaming Updates](https://redux-toolkit.js.org/rtk-query/usage/streaming-updates)
- [RTK Query — Mutations](https://redux-toolkit.js.org/rtk-query/usage/mutations)
- [RTK Query — Manual Cache Updates](https://redux-toolkit.js.org/rtk-query/usage/manual-cache-updates)
- [RTK Query — Code Splitting](https://redux-toolkit.js.org/rtk-query/usage/code-splitting)
- [RTK Query — API Hooks Reference](https://redux-toolkit.js.org/rtk-query/api/created-api/hooks)
