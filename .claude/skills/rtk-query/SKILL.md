---
name: rtk-query
description: RTK Query patterns and best practices for this project. Use when writing, reviewing, or refactoring RTK Query endpoints, mutations, cache invalidation, or Firestore integration. Triggers on tasks involving API slices, queries, mutations, cache tags, optimistic updates, or streaming/realtime listeners.
metadata:
  version: '1.0.0'
---

# RTK Query Best Practices

Comprehensive guide for writing correct, performant RTK Query code in this project. This project uses `fakeBaseQuery()` with `queryFn` to call Firestore directly — there are no HTTP API routes.

## When to Apply

Reference these guidelines when:

- Creating new API endpoints (queries or mutations)
- Writing `queryFn` functions with Firestore calls
- Setting up cache invalidation with tags
- Implementing optimistic or pessimistic updates
- Adding realtime Firestore listeners via `onCacheEntryAdded`
- Reviewing RTK Query code for correctness
- Debugging cache or re-render issues

## How to Use

Read `AGENTS.md` in this skill directory for the full reference with detailed rules, code examples, and project-specific patterns.

## Quick Reference

### Architecture

- **One API slice** — `src/store/api.ts` is the single `createApi` call
- **Inject per feature** — use `api.injectEndpoints()` in feature-level `*Api.ts` files
- **Never create multiple API slices** — tags only work within the same slice

### File Conventions

```
src/
  store/
    api.ts              # Base API slice (fakeBaseQuery, tagTypes)
    store.ts            # configureStore, type exports
    hooks.ts            # Typed useAppDispatch / useAppSelector
  components/
    todos/
      todosApi.ts       # injectEndpoints for todo queries/mutations
    auth/
      authApi.ts        # injectEndpoints for auth queries/mutations
```

### Rule Categories

| Category     | Key Rules                                                                     |
| ------------ | ----------------------------------------------------------------------------- |
| Architecture | One API slice, inject per feature, never multiple createApi                   |
| queryFn      | Never throw — always return `{ data }` or `{ error }`, catch all exceptions   |
| Tags         | Use LIST id pattern, guard undefined result in providesTags                   |
| Mutations    | `.unwrap()` for try/catch, optimistic via `onQueryStarted`                    |
| Streaming    | `onCacheEntryAdded` for Firestore `onSnapshot`, always clean up               |
| Hooks        | `skipToken` over `skip: true`, `selectFromResult` for derived data            |
| Performance  | Memoize selectors with `createSelector`, avoid new refs in `selectFromResult` |
