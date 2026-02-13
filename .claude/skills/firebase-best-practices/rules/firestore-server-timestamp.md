---
title: Use serverTimestamp() for date fields
impact: MEDIUM
impactDescription: Client timestamps are unreliable; server timestamps ensure consistency across devices
tags: firestore, timestamp, data
---

## Use serverTimestamp() for Date Fields

**Impact: MEDIUM (client timestamps are unreliable; server timestamps ensure consistency across devices)**

Use `serverTimestamp()` for `createdAt`, `updatedAt`, and any other time-based fields. Client-side timestamps (`new Date()`, `Date.now()`) depend on the user's device clock, which may be inaccurate, in a different timezone, or deliberately manipulated. Server timestamps are set by Firestore servers and are consistent across all clients.

**Incorrect (client-side timestamp):**

```ts
import { addDoc, collection } from 'firebase/firestore'

import { db } from '@/firebase/config'

async function addTodo(title: string, userId: string) {
  await addDoc(collection(db, 'todos'), {
    title,
    userId,
    // Client clock may be wrong, inconsistent across devices
    createdAt: new Date().toISOString(),
    updatedAt: Date.now(),
  })
}
```

**Correct (server timestamp):**

```ts
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'

import { db } from '@/firebase/config'

async function addTodo(title: string, userId: string) {
  await addDoc(collection(db, 'todos'), {
    title,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}
```

Note: `serverTimestamp()` returns a sentinel value that Firestore replaces with the server time on write. When reading the document back, the field will be a Firestore `Timestamp` object. In local snapshots (before the write is confirmed), the field may be `null` — use `{ serverTimestamps: 'estimate' }` in snapshot options if you need an immediate value.

Reference: [Add data to Cloud Firestore — Server Timestamp](https://firebase.google.com/docs/firestore/manage-data/add-data#server_timestamp)
