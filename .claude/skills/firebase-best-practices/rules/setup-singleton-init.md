---
title: Initialize Firebase at module level
impact: CRITICAL
impactDescription: Multiple initializeApp calls crash the app; component-level init causes re-initialization
tags: setup, initialization
---

## Initialize Firebase at Module Level

**Impact: CRITICAL (multiple initializeApp calls crash the app; component-level init causes re-initialization)**

Initialize the Firebase app, auth, and Firestore instances once at module level in a dedicated file (e.g., `firebase/config.ts`). Export the initialized instances for use throughout the app. Calling `initializeApp` more than once with different configs throws an error, and calling it inside a component or `useEffect` risks re-initialization on every mount or re-render.

**Incorrect (initializes inside a component):**

```ts
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

function App() {
  useEffect(() => {
    // Runs on every mount — crashes if called twice with different configs
    const app = initializeApp(firebaseConfig)
    const auth = getAuth(app)
    const db = getFirestore(app)
  }, [])

  return <div>...</div>
}
```

**Correct (module-level singleton in a dedicated file):**

```ts
// firebase/config.ts
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
```

```ts
// Any other file — just import the instances
import { auth, db } from '@/firebase/config'
```

Reference: [Add Firebase to your JavaScript project](https://firebase.google.com/docs/web/setup)
