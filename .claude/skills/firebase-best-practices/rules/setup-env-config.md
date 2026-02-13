---
title: Use VITE_ env vars for Firebase config
impact: HIGH
impactDescription: Hardcoded config in source is a security and deployment concern
tags: setup, config, env
---

## Use VITE\_ Env Vars for Firebase Config

**Impact: HIGH (hardcoded config in source is a security and deployment concern)**

Store all Firebase configuration values in environment variables prefixed with `VITE_`. Vite only exposes env vars with this prefix to client code via `import.meta.env`. Keep a `.env.example` file in version control documenting required variables (without real values). Keep `.env` and `.env.local` out of git via `.gitignore`.

**Incorrect (hardcoded config in source):**

```ts
// firebase/config.ts — config values committed to git
const firebaseConfig = {
  apiKey: 'AIzaSyB1234567890abcdefg',
  authDomain: 'my-app.firebaseapp.com',
  projectId: 'my-app',
  storageBucket: 'my-app.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abc123',
}
```

**Correct (config from environment variables):**

```ts
// firebase/config.ts — reads from env vars
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}
```

```bash
# .env.example (committed to git — no real values)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

```bash
# .env.local (NOT committed to git — contains real values)
VITE_FIREBASE_API_KEY=AIzaSyB1234567890abcdefg
VITE_FIREBASE_AUTH_DOMAIN=my-app.firebaseapp.com
# ...
```

Reference: [Env Variables and Modes](https://vite.dev/guide/env-and-mode)
