---
title: Use initializeAuth() for smaller bundles
impact: HIGH
impactDescription: getAuth() bundles all persistence types and resolvers; initializeAuth() lets you pick only what you need
tags: auth, initialization, bundle-size
---

## Use initializeAuth() for Smaller Bundles

**Impact: HIGH (getAuth() bundles all persistence types and resolvers; initializeAuth() lets you pick only what you need)**

`getAuth(app)` is a convenience function that automatically includes all persistence mechanisms (indexedDB, localStorage, sessionStorage) and all popup/redirect resolvers. If you only need one persistence type and one resolver, use `initializeAuth` with explicit dependencies to significantly reduce your auth bundle size.

**Incorrect (getAuth bundles everything):**

```ts
import { getAuth } from 'firebase/auth'

import { app } from '@/firebase/config'

// Bundles all persistence types and all resolvers (~20-30% larger auth bundle)
export const auth = getAuth(app)
```

**Correct (initializeAuth with only what you need):**

```ts
import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  initializeAuth,
} from 'firebase/auth'

import { app } from '@/firebase/config'

// Only bundles local persistence and popup resolver
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
  popupRedirectResolver: browserPopupRedirectResolver,
})
```

Choose the persistence and resolver that match your app's needs:

- `browserLocalPersistence` — survives browser restarts (most common for web apps)
- `browserSessionPersistence` — cleared when tab closes
- `inMemoryPersistence` — cleared on page refresh (useful for tests)
- `browserPopupRedirectResolver` — needed for `signInWithPopup` or `signInWithRedirect`

Reference: [Custom dependencies for Firebase Auth](https://firebase.google.com/docs/auth/web/custom-dependencies)
