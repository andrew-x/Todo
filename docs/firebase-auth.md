# Firebase Auth

> The app uses Firebase Authentication with Google sign-in via popup. Auth state is managed through a React Context (`AuthProvider`) that wraps the route tree, providing the current user, loading state, and sign-in/sign-out functions to all components. Route protection is handled by a `ProtectedRoute` wrapper that redirects unauthenticated users to the landing page.

## Overview

Authentication is built on three layers:

1. **Firebase SDK initialization** -- A single `src/lib/firebase.ts` file initializes the Firebase app and exports the `auth` and `db` instances.
2. **React Context** -- `AuthProvider` subscribes to Firebase's `onAuthStateChanged` listener and exposes auth state and actions via a `useAuth` hook.
3. **Route guards** -- `ProtectedRoute` wraps any route that requires authentication, redirecting anonymous users to `/`.

The landing page (`/`) acts as the sign-in screen for unauthenticated users and auto-redirects authenticated users to `/home`.

## Key Files

| File                                         | Role                                                                  |
| -------------------------------------------- | --------------------------------------------------------------------- |
| `src/lib/firebase.ts`                        | Firebase app init, exports `auth` and `db` instances                  |
| `src/components/auth/AuthProvider.tsx`       | Auth context provider + `useAuth` hook                                |
| `src/components/auth/ProtectedRoute.tsx`     | Route guard -- redirects unauthenticated users to `/`                 |
| `src/components/auth/GoogleSignInButton.tsx` | Sign-in button with loading/error UI                                  |
| `src/pages/LandingPage.tsx`                  | Public page with sign-in; redirects authenticated users to `/home`    |
| `src/App.tsx`                                | Wraps route tree in `AuthProvider`; header shows user name + sign-out |
| `.env.example`                               | Template for required `VITE_FIREBASE_*` environment variables         |

## How It Works

### Firebase Initialization

`src/lib/firebase.ts` initializes the Firebase app from environment variables and exports two singleton instances:

- **`auth`** -- Created with `initializeAuth()` (not `getAuth()`), configured with `browserLocalPersistence` and `browserPopupRedirectResolver`. This tree-shakeable approach only bundles the persistence and resolver strategies actually used.
- **`db`** -- Created with `getFirestore()` for Firestore access (used by RTK Query endpoints, not by auth).

All six Firebase config values come from `VITE_FIREBASE_*` environment variables (see [Configuration](#configuration) below).

### Auth State Management

`AuthProvider` (`src/components/auth/AuthProvider.tsx`) sets up a `useEffect` that subscribes to `onAuthStateChanged`. This Firebase listener fires immediately with the current auth state (or `null` if no session exists) and then on every subsequent state change (sign-in, sign-out, token refresh).

The provider manages two pieces of state:

- `user` (`User | null`) -- The Firebase `User` object, or `null` when signed out.
- `isLoading` (`boolean`) -- Starts as `true`, set to `false` after the first `onAuthStateChanged` callback. This prevents UI flash where a returning user briefly sees the sign-in screen.

The provider also exposes two async actions:

- `signInWithGoogle()` -- Calls `signInWithPopup(auth, googleProvider)`. The popup approach keeps the SPA in place (no redirect, no state loss).
- `signOut()` -- Calls Firebase's `signOut(auth)`.

The `useAuth()` hook consumes this context and throws if called outside `AuthProvider`.

### Route Protection

`ProtectedRoute` (`src/components/auth/ProtectedRoute.tsx`) is a wrapper component, not a route itself. It reads auth state via `useAuth()` and has three branches:

1. **Loading** (`isLoading` is true) -- Renders a "Loading..." placeholder. This covers the initial `onAuthStateChanged` check.
2. **Unauthenticated** (`user` is null) -- Renders `<Navigate to="/" replace />` to redirect to the landing page.
3. **Authenticated** -- Renders `children`.

Protected routes are wrapped in `src/App.tsx`:

```tsx
<Route
  path="home"
  element={
    <ProtectedRoute>
      <HomePage />
    </ProtectedRoute>
  }
/>
```

### Sign-In Flow

1. Unauthenticated user lands on `/` and sees `LandingPage` with the `GoogleSignInButton`.
2. User clicks "Sign in with Google" -- `GoogleSignInButton` calls `signInWithGoogle()` from `useAuth()`.
3. Firebase opens a popup window for Google OAuth.
4. On success, `onAuthStateChanged` fires with the `User` object, updating `AuthProvider` state.
5. `LandingPage` re-renders, sees `user` is truthy, and renders `<Navigate to="/home" replace />`.
6. `RootLayout` header now shows the user's `displayName` and a "Sign out" button.

If the popup fails (closed by user, network error, etc.), `GoogleSignInButton` catches the error and displays "Sign-in failed. Please try again." below the button.

### Sign-Out Flow

1. User clicks "Sign out" in the header (`RootLayout` in `src/App.tsx`).
2. `signOut()` from `useAuth()` calls Firebase's `signOut(auth)`.
3. `onAuthStateChanged` fires with `null`, updating `user` to `null`.
4. Any `ProtectedRoute`-wrapped page redirects to `/`.
5. Header hides the user name, sign-out button, and "Home" nav link.

## Architecture / Component Tree

```
<BrowserRouter>
  <AuthProvider>                            <!-- subscribes to onAuthStateChanged -->
    <Routes>
      <Route element={<RootLayout />}>      <!-- header: nav + user info + sign out -->
        <Route index → LandingPage />       <!-- public: sign-in or redirect to /home -->
        <Route path="home"
          element={
            <ProtectedRoute>                <!-- guard: redirect to / if not authed -->
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" → NotFoundPage />
      </Route>
    </Routes>
  </AuthProvider>
</BrowserRouter>
```

`AuthProvider` sits inside `BrowserRouter` (it does not depend on routing) but outside `Routes` so that every component in the tree -- including `RootLayout` -- can call `useAuth()`.

## Configuration

Auth requires six environment variables. Copy `.env.example` to `.env` and fill in the values from your Firebase project's console (Project Settings > General > Your apps > Web app):

| Variable                            | Description                                      |
| ----------------------------------- | ------------------------------------------------ |
| `VITE_FIREBASE_API_KEY`             | Firebase Web API key                             |
| `VITE_FIREBASE_AUTH_DOMAIN`         | Auth domain (e.g., `project-id.firebaseapp.com`) |
| `VITE_FIREBASE_PROJECT_ID`          | Firebase project ID                              |
| `VITE_FIREBASE_STORAGE_BUCKET`      | Cloud Storage bucket                             |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Cloud Messaging sender ID                        |
| `VITE_FIREBASE_APP_ID`              | Firebase app ID                                  |

All variables use the `VITE_` prefix so Vite exposes them to client code via `import.meta.env`. The `.env` file is gitignored.

## Design Decisions

- **Popup over redirect for Google sign-in.** `signInWithPopup` keeps the SPA in place -- no full-page navigation, no state loss, no need to handle redirect callbacks. This is simpler for a single-page app where the user stays on the same page during auth.

- **`initializeAuth()` over `getAuth()`.** The `getAuth()` convenience function bundles all persistence strategies and resolvers. `initializeAuth()` accepts only the specific strategies needed (`browserLocalPersistence` + `browserPopupRedirectResolver`), resulting in a smaller bundle.

- **Single `src/lib/firebase.ts` over a `firebase/` directory.** The file only contains initialization code (no helpers, no Firestore references). A dedicated directory would be premature -- if Firebase-related code grows (e.g., Firestore collection refs, auth helpers), it can be extracted then.

- **React Context over Redux for auth state.** Auth state is simple (a user object and a boolean), consumed by a few components, and does not benefit from Redux's normalized cache or middleware. Keeping it in Context avoids coupling auth to the store and keeps the auth module self-contained. RTK Query handles the more complex server-state needs.

- **React 19 context syntax.** The provider uses `<AuthContext value={...}>` instead of `<AuthContext.Provider value={...}>`. React 19 supports rendering context objects directly as components, and the `.Provider` sub-component is deprecated.

- **`ProtectedRoute` as a wrapper, not a route component.** This pattern wraps route elements inline rather than being a route itself. It is more flexible than layout-route-based guards because each route can independently opt into protection.

## Adding a New Auth Provider

To add another sign-in method (e.g., GitHub, email/password):

1. **Create the provider instance** in `src/components/auth/AuthProvider.tsx`:

   ```ts
   import { GithubAuthProvider } from 'firebase/auth'

   const githubProvider = new GithubAuthProvider()
   ```

2. **Add a sign-in function** in the `AuthProvider` component and include it in the context value:

   ```ts
   async function signInWithGithub() {
     await signInWithPopup(auth, githubProvider)
   }
   ```

3. **Update the `AuthContextValue` type** to include the new function:

   ```ts
   type AuthContextValue = {
     // ...existing fields
     signInWithGithub: () => Promise<void>
   }
   ```

4. **Create a sign-in button component** in `src/components/auth/` following the `GoogleSignInButton` pattern (local loading + error state, calls the new sign-in function).

5. **Add the button to `LandingPage`** alongside the existing `GoogleSignInButton`.

No changes to `ProtectedRoute`, `RootLayout`, or the route table are needed -- the auth state flows through the same context regardless of the sign-in provider.

## Edge Cases and Important Notes

- **Initial auth check is async.** There is always a brief period after page load where `isLoading` is `true` and the user's auth state is unknown. Both `LandingPage` and `ProtectedRoute` handle this by rendering a loading state, preventing flashes of wrong content.
- **Popup blockers.** Browser popup blockers may prevent the Google sign-in popup from opening. Firebase surfaces this as an error, which `GoogleSignInButton` catches and displays to the user.
- **`browserLocalPersistence`** means the user's session survives page reloads and browser restarts. Firebase stores the auth token in `localStorage`. To change this behavior (e.g., session-only persistence), swap the persistence strategy in `src/lib/firebase.ts`.
- **No server-side auth verification.** The current implementation is client-only. If server-side route protection or API authorization is added later, Firebase Admin SDK would be needed on the server to verify ID tokens.
- **The `useAuth` hook throws outside `AuthProvider`.** This is intentional -- it surfaces misconfigured component trees immediately during development rather than returning silent `undefined` values.

## Related Documentation

- [Routing](./routing.md) -- Route table and layout structure
- [State Management](./state-management.md) -- RTK Query and Redux store (separate from auth state)
- [Design System](./design-system.md) -- `Button` component used by `GoogleSignInButton` and header sign-out
