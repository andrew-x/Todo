# RTK Query 2.x Reference Notes

## Key Patterns for This Project (fakeBaseQuery + Firestore)

### fakeBaseQuery error typing

```ts
baseQuery: fakeBaseQuery<CustomErrorType>()
```

All queryFn endpoints must return `{ error: CustomErrorType }` on failure.

### queryFn signature

```ts
queryFn: async (
  arg,
  { dispatch, getState, signal },
  extraOptions,
  baseQuery,
) => {
  return { data: result } // or { error: errorObj }
}
```

### Streaming with onCacheEntryAdded + Firestore onSnapshot

- Use `queryFn: () => ({ data: [] })` as initial no-op
- Await `cacheDataLoaded` before attaching listener
- Use `updateCachedData` (Immer-powered) for updates
- Await `cacheEntryRemoved` then unsubscribe

### Cache invalidation

- `providesTags` callback: `(result) => result ? [...result.map(({id}) => ({type, id})), {type, id: 'LIST'}] : [{type, id: 'LIST'}]`
- `invalidatesTags` on mutations: `[{type, id: 'LIST'}]` for adds, `(result, error, {id}) => [{type, id}]` for updates/deletes

### Optimistic updates

- In `onQueryStarted`: dispatch `api.util.updateQueryData`, then `queryFulfilled.catch(patchResult.undo)`

### Code splitting

- One `createApi` call per app
- Use `api.injectEndpoints()` from feature files
- Export hooks from the injected endpoints file

## Common Pitfalls (from GitHub #3692 and community)

- Multiple API slices breaks tag invalidation
- `isLoading` vs `isFetching`: isLoading is only true on first load, isFetching on every fetch
- selectFromResult must return new objects carefully to avoid re-renders
- onCacheEntryAdded doesn't fire on cache hits
- keepUnusedDataFor default is 60 seconds
