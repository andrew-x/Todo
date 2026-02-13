---
name: firebase-best-practices
description: Firebase best practices for this project covering setup, authentication, Firestore, and performance optimization. This skill should be used when writing, reviewing, or refactoring Firebase code, setting up auth or Firestore, or optimizing Firebase bundle size.
---

# Firebase Best Practices

Best practices guide for Firebase in this project (modular SDK v10+, Vite, React). Contains 14 rules across 4 categories, prioritized by impact to guide code generation and review.

## When to Apply

Reference these guidelines when:

- Writing or reviewing Firebase initialization and configuration
- Implementing authentication flows (sign-in, sign-out, auth state)
- Reading or writing Firestore data (queries, mutations, real-time listeners)
- Integrating Firestore with RTK Query
- Optimizing Firebase bundle size
- Writing or reviewing Firestore security rules

## Rule Categories by Priority

| Priority | Category              | Impact   | Prefix       |
| -------- | --------------------- | -------- | ------------ |
| 1        | Setup & Configuration | CRITICAL | `setup-`     |
| 2        | Authentication        | HIGH     | `auth-`      |
| 3        | Firestore             | HIGH     | `firestore-` |
| 4        | Performance           | MEDIUM   | `perf-`      |

## Quick Reference

### 1. Setup & Configuration (CRITICAL)

- `setup-modular-imports` - Use modular imports from sub-packages
- `setup-singleton-init` - Initialize Firebase at module level
- `setup-env-config` - Use VITE\_ env vars for Firebase config

### 2. Authentication (HIGH)

- `auth-state-listener` - Use onAuthStateChanged for auth state
- `auth-cleanup-listeners` - Always unsubscribe auth listeners
- `auth-popup-over-redirect` - Prefer signInWithPopup for SPAs
- `auth-initialize-auth` - Use initializeAuth() for smaller bundles

### 3. Firestore (HIGH)

- `firestore-security-rules` - Default deny, scope by uid
- `firestore-realtime-cleanup` - Unsubscribe onSnapshot listeners
- `firestore-rtk-query-pattern` - Use onCacheEntryAdded with onSnapshot for RTK Query
- `firestore-server-timestamp` - Use serverTimestamp() for date fields

### 4. Performance (MEDIUM)

- `perf-tree-shaking` - Use static imports only
- `perf-firestore-lite` - Use firebase/firestore/lite for one-time reads

## How to Use

Read individual rule files for detailed explanations and code examples:

```
rules/setup-modular-imports.md
rules/auth-state-listener.md
rules/firestore-rtk-query-pattern.md
```

Each rule file contains:

- Brief explanation of why it matters
- Incorrect code example with explanation
- Correct code example with explanation
- Reference link to official documentation
