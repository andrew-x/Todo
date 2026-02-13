---
title: Use static imports only
impact: MEDIUM
impactDescription: Dynamic import() of Firebase modules defeats tree-shaking
tags: performance, imports, bundle-size
---

## Use Static Imports Only

**Impact: MEDIUM (dynamic import() of Firebase modules defeats tree-shaking)**

Only use static `import { ... } from 'firebase/...'` statements for Firebase modules. Dynamic `import()` prevents the bundler from analyzing which specific functions are used, which defeats tree-shaking and can pull in the entire module. Static imports allow Vite/Rollup to eliminate unused code at build time.

**Incorrect (dynamic import defeats tree-shaking):**

```ts
async function signIn() {
  // Bundler cannot tree-shake — entire firebase/auth module is included
  const { getAuth, signInWithPopup, GoogleAuthProvider } =
    await import('firebase/auth')
  const auth = getAuth()
  await signInWithPopup(auth, new GoogleAuthProvider())
}
```

**Correct (static imports — fully tree-shakeable):**

```ts
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'

import { auth } from '@/firebase/config'

async function signIn() {
  await signInWithPopup(auth, new GoogleAuthProvider())
}
```

If you need code-splitting for Firebase (e.g., only loading auth when the user clicks "Sign In"), split at the component level using `React.lazy()` rather than dynamically importing Firebase modules directly.

Reference: [Using module bundlers with Firebase](https://firebase.google.com/docs/web/module-bundling)
