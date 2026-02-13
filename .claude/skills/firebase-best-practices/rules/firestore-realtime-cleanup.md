---
title: Unsubscribe onSnapshot listeners
impact: HIGH
impactDescription: Leaked listeners keep WebSocket connections alive and cause stale state updates
tags: firestore, realtime, cleanup
---

## Unsubscribe onSnapshot Listeners

**Impact: HIGH (leaked listeners keep WebSocket connections alive and cause stale state updates)**

`onSnapshot` establishes a real-time WebSocket connection to Firestore. It returns an unsubscribe function that must be called when the listener is no longer needed. In React, always return the unsubscribe function from `useEffect` cleanup. Leaked listeners continue receiving updates and attempting state changes after the component unmounts, wasting bandwidth and causing errors.

**Incorrect (no cleanup — listener leaks):**

```ts
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase/config'

function TodoList({ userId }: { userId: string }) {
  const [todos, setTodos] = useState<Todo[]>([])

  useEffect(() => {
    const q = collection(db, 'todos')
    // Listener is never cleaned up — WebSocket stays open forever
    onSnapshot(q, (snapshot) => {
      setTodos(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Todo)))
    })
  }, [])

  return <ul>{todos.map((t) => <li key={t.id}>{t.title}</li>)}</ul>
}
```

**Correct (unsubscribe on cleanup):**

```ts
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '@/firebase/config'

function TodoList({ userId }: { userId: string }) {
  const [todos, setTodos] = useState<Todo[]>([])

  useEffect(() => {
    const q = query(collection(db, 'todos'), where('userId', '==', userId))
    const unsub = onSnapshot(q, (snapshot) => {
      setTodos(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Todo)))
    })
    return unsub
  }, [userId])

  return <ul>{todos.map((t) => <li key={t.id}>{t.title}</li>)}</ul>
}
```

When the `userId` dependency changes, React runs cleanup for the previous effect (unsubscribing the old listener) before setting up the new one.

Reference: [Listen to real-time updates](https://firebase.google.com/docs/firestore/query-data/listen)
