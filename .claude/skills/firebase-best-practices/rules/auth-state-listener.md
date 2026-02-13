---
title: Use onAuthStateChanged for auth state
impact: CRITICAL
impactDescription: auth.currentUser is null until first listener fires; direct access causes race conditions
tags: auth, state, listener
---

## Use onAuthStateChanged for Auth State

**Impact: CRITICAL (auth.currentUser is null until first listener fires; direct access causes race conditions)**

Always use `onAuthStateChanged(auth, callback)` to observe authentication state. The `auth.currentUser` property is `null` until Firebase finishes initializing and the first auth state listener fires. Checking `auth.currentUser` directly at module load or during component mount leads to race conditions where the user appears logged out even when they have a valid session.

**Incorrect (direct access to currentUser):**

```ts
import { auth } from '@/firebase/config'

function ProfilePage() {
  // auth.currentUser is null on first render — user appears logged out
  const user = auth.currentUser

  if (!user) {
    return <Navigate to="/login" />
  }

  return <div>Welcome, {user.displayName}</div>
}
```

**Correct (reactive listener with loading state):**

```ts
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '@/firebase/config'

function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setIsLoading(false)
    })
    return unsub
  }, [])

  if (isLoading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" />

  return <div>Welcome, {user.displayName}</div>
}
```

Reference: [Manage Users in Firebase](https://firebase.google.com/docs/auth/web/manage-users)
