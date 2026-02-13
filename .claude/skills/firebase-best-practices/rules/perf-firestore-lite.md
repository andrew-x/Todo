---
title: Use firebase/firestore/lite for one-time reads
impact: MEDIUM
impactDescription: Full Firestore includes offline persistence and real-time sync (~84% larger than lite)
tags: performance, firestore, bundle-size
---

## Use firebase/firestore/lite for One-Time Reads

**Impact: MEDIUM (full Firestore includes offline persistence and real-time sync — ~84% larger than lite)**

When you only need one-time reads (no real-time listeners, no offline persistence), import from `firebase/firestore/lite` instead of `firebase/firestore`. The lite SDK excludes the real-time sync engine and offline cache, resulting in a significantly smaller bundle. This is ideal for pages that fetch data once on load, admin panels, or server-side rendering.

**Incorrect (full Firestore for simple one-time reads):**

```ts
// Pulls in real-time engine + offline persistence even though neither is used
import { doc, getDoc, getFirestore } from 'firebase/firestore'

import { app } from '@/firebase/config'

const db = getFirestore(app)

async function getTodo(id: string) {
  const snap = await getDoc(doc(db, 'todos', id))
  return snap.data()
}
```

**Correct (lite SDK for one-time reads):**

```ts
// ~84% smaller — no real-time, no offline cache
import { doc, getDoc, getFirestore } from 'firebase/firestore/lite'

import { app } from '@/firebase/config'

const db = getFirestore(app)

async function getTodo(id: string) {
  const snap = await getDoc(doc(db, 'todos', id))
  return snap.data()
}
```

Important caveats:

- **Cannot mix** `firebase/firestore` and `firebase/firestore/lite` in the same app — pick one per Firestore instance
- The lite SDK does **not** support `onSnapshot` (real-time listeners)
- The lite SDK does **not** support offline persistence
- For this project (which uses RTK Query + `onSnapshot` for real-time todos), the full SDK is appropriate for the main Firestore instance. Consider lite only for separate, isolated read-only use cases.

Reference: [Cloud Firestore Lite Web SDK](https://firebase.google.com/docs/firestore/quickstart)
