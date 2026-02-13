---
title: Always unsubscribe auth listeners
impact: HIGH
impactDescription: Leaked listeners cause memory leaks and stale state updates
tags: auth, cleanup, useEffect
---

## Always Unsubscribe Auth Listeners

**Impact: HIGH (leaked listeners cause memory leaks and stale state updates)**

`onAuthStateChanged` returns an unsubscribe function. When using it inside a `useEffect`, always return the unsubscribe function as the cleanup. Without cleanup, the listener persists after the component unmounts, causing memory leaks and attempting state updates on unmounted components.

**Incorrect (no cleanup — listener leaks):**

```ts
useEffect(() => {
  // Listener is never cleaned up — memory leak
  onAuthStateChanged(auth, (user) => {
    setUser(user)
    setIsLoading(false)
  })
}, [])
```

**Correct (unsubscribe on cleanup):**

```ts
useEffect(() => {
  const unsub = onAuthStateChanged(auth, (user) => {
    setUser(user)
    setIsLoading(false)
  })
  return unsub
}, [])
```

The same pattern applies to any Firebase listener that returns an unsubscribe function, including `onIdTokenChanged` and Firestore's `onSnapshot`.

Reference: [Manage Users in Firebase](https://firebase.google.com/docs/auth/web/manage-users)
