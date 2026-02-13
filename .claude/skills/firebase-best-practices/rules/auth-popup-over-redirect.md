---
title: Prefer signInWithPopup for SPAs
impact: MEDIUM
impactDescription: Redirect flow loses SPA state and requires getRedirectResult handling
tags: auth, signin, popup
---

## Prefer signInWithPopup for SPAs

**Impact: MEDIUM (redirect flow loses SPA state and requires getRedirectResult handling)**

Use `signInWithPopup` instead of `signInWithRedirect` for single-page applications. The redirect flow navigates the user away from your app, which destroys all in-memory state (Redux store, component state, etc.). It also requires calling `getRedirectResult` on every page load to handle the returning user. The popup flow keeps the SPA intact and resolves the sign-in as a simple promise.

**Incorrect (redirect flow in an SPA):**

```ts
import {
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
} from 'firebase/auth'
import { auth } from '@/firebase/config'

// Must handle redirect result on every page load
getRedirectResult(auth).then((result) => {
  if (result) {
    // user signed in
  }
})

function LoginPage() {
  const handleSignIn = () => {
    // Navigates away — all SPA state is lost
    signInWithRedirect(auth, new GoogleAuthProvider())
  }

  return <button onClick={handleSignIn}>Sign in with Google</button>
}
```

**Correct (popup flow — SPA state preserved):**

```ts
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '@/firebase/config'

function LoginPage() {
  const handleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider())
      // User signed in — SPA state intact, result available immediately
    } catch (error) {
      // Handle popup closed, network error, etc.
    }
  }

  return <button onClick={handleSignIn}>Sign in with Google</button>
}
```

Reference: [Sign in with Google using JavaScript](https://firebase.google.com/docs/auth/web/google-signin)
