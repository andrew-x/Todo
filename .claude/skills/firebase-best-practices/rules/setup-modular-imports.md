---
title: Use modular imports from sub-packages
impact: CRITICAL
impactDescription: Tree-shaking only works with modular imports; root imports bundle everything
tags: setup, imports, bundle-size
---

## Use Modular Imports from Sub-packages

**Impact: CRITICAL (tree-shaking only works with modular imports; root imports bundle everything)**

Always import Firebase functions from their specific sub-packages (`firebase/auth`, `firebase/firestore`, etc.). The modular Firebase SDK (v9+) is designed for tree-shaking, but only when you import from the correct entry points. Importing from the root `firebase` package or using the compat layer pulls in the entire SDK, drastically increasing bundle size.

**Incorrect (bundles the entire Firebase SDK):**

```ts
// Root import — no tree-shaking, entire SDK is bundled

// Named import from root — also bundles everything
import { getAuth } from 'firebase'
import firebase from 'firebase/app'
// Compat layer — wraps the entire old SDK
import firebase from 'firebase/compat/app'

import 'firebase/compat/auth'
```

**Correct (tree-shakeable modular imports):**

```ts
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { collection, getDocs, getFirestore } from 'firebase/firestore'
```

Reference: [Upgrade to the modular Web SDK](https://firebase.google.com/docs/web/modular-upgrade)
