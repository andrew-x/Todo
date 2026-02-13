---
title: Default deny, scope by uid
impact: CRITICAL
impactDescription: Open rules expose all data; missing uid checks allow cross-user access
tags: firestore, security, rules
---

## Default Deny, Scope by UID

**Impact: CRITICAL (open rules expose all data; missing uid checks allow cross-user access)**

Firestore security rules are the last line of defense for your data. Start with deny-all, then open specific paths. Every rule should verify `request.auth != null` and scope data access by `request.auth.uid`. Validate the shape of incoming data to prevent malformed writes.

**Incorrect (open rules — anyone can read/write everything):**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      // NEVER do this — all data is public
      allow read, write: if true;
    }
  }
}
```

**Correct (deny by default, scoped by uid, validated):**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // No default rule — everything is denied unless explicitly allowed

    match /todos/{todoId} {
      // Only authenticated users can read their own todos
      allow read: if request.auth != null
                  && request.auth.uid == resource.data.userId;

      // Validate data shape on create
      allow create: if request.auth != null
                    && request.auth.uid == request.resource.data.userId
                    && request.resource.data.keys().hasAll(['title', 'userId', 'createdAt'])
                    && request.resource.data.title is string;

      // Only the owner can update or delete
      allow update, delete: if request.auth != null
                            && request.auth.uid == resource.data.userId;
    }
  }
}
```

Key principles:

- **No wildcard rules** — never use `match /{document=**}` with permissive access
- **Always check auth** — `request.auth != null` on every rule
- **Scope by uid** — compare `request.auth.uid` against the document's `userId` field
- **Validate writes** — check required fields and types on `create` and `update`

Reference: [Get started with Cloud Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
