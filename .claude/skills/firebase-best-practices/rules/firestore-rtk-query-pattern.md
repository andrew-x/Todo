---
title: Use onCacheEntryAdded with onSnapshot for RTK Query
impact: HIGH
impactDescription: Incorrect RTK Query + Firestore integration leads to stale data or leaked listeners
tags: firestore, rtk-query, realtime
---

## Use onCacheEntryAdded with onSnapshot for RTK Query

**Impact: HIGH (incorrect RTK Query + Firestore integration leads to stale data or leaked listeners)**

When integrating Firestore real-time data with RTK Query, use `fakeBaseQuery()` combined with the `onCacheEntryAdded` lifecycle. This pattern sets up an `onSnapshot` listener that keeps the RTK cache in sync with Firestore. Always await `cacheDataLoaded` before subscribing to prevent premature updates, and unsubscribe when `cacheEntryRemoved` resolves.

**Incorrect (one-time fetch with queryFn — no real-time updates):**

```ts
import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import { collection, getDocs, query, where } from 'firebase/firestore'

import { db } from '@/firebase/config'

const todosApi = createApi({
  baseQuery: fakeBaseQuery(),
  endpoints: (builder) => ({
    getTodos: builder.query<Todo[], string>({
      // Only fetches once — never receives real-time updates
      queryFn: async (userId) => {
        const q = query(collection(db, 'todos'), where('userId', '==', userId))
        const snapshot = await getDocs(q)
        const todos = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Todo,
        )
        return { data: todos }
      },
    }),
  }),
})
```

**Correct (onCacheEntryAdded with onSnapshot — real-time sync):**

```ts
import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'

import { db } from '@/firebase/config'

const todosApi = createApi({
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Todo'],
  endpoints: (builder) => ({
    getTodos: builder.query<Todo[], string>({
      // Initial queryFn provides the first value for the cache
      queryFn: () => ({ data: [] }),
      // onCacheEntryAdded sets up the real-time listener
      async onCacheEntryAdded(
        userId,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) {
        // Wait for initial cache data before subscribing
        await cacheDataLoaded

        const q = query(collection(db, 'todos'), where('userId', '==', userId))

        const unsub = onSnapshot(q, (snapshot) => {
          updateCachedData(() =>
            snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Todo),
          )
        })

        // Unsubscribe when the cache entry is removed
        await cacheEntryRemoved
        unsub()
      },
    }),
  }),
})
```

Key points:

- `queryFn` provides the initial cache value (can be an empty array)
- `await cacheDataLoaded` ensures the cache entry exists before updating it
- `updateCachedData` uses Immer — you can return a new value or mutate the draft
- `await cacheEntryRemoved` blocks until no components subscribe to this cache entry
- The `unsub()` call after `cacheEntryRemoved` prevents leaked Firestore listeners

Reference: [Streaming Updates with RTK Query](https://redux-toolkit.js.org/rtk-query/usage/streaming-updates)
