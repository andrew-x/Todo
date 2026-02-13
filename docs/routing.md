# Routing

> The app uses React Router v7 in **library/declarative mode** (the `react-router` package with `BrowserRouter`, `Routes`, and `Route`). All routes are defined inline in `src/App.tsx` and nested under a shared root layout that provides a persistent, auth-aware nav header.

## Overview

React Router v7 ships as a single `react-router` package (the former `react-router-dom` was merged into it). This project uses the **library (declarative) mode** -- meaning routes are defined as JSX `<Route>` elements rather than using the framework/file-based routing mode. This keeps routing explicit and co-located in one file.

## Key Files

| File                                     | Role                                                                                                 |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `src/main.tsx`                           | Entry point -- renders `<App />` inside `StrictMode` and Redux `Provider`                            |
| `src/App.tsx`                            | Composition root -- `BrowserRouter`, `AuthProvider`, route table, and `RootLayout` (all in one file) |
| `src/pages/LandingPage.tsx`              | Public landing page (`/`) -- redirects to `/home` if already signed in                               |
| `src/pages/HomePage.tsx`                 | Todos workspace page (`/home`) -- protected, requires authentication                                 |
| `src/pages/ErrorPage.tsx`                | Error boundary page -- shown when a route throws                                                     |
| `src/pages/NotFoundPage.tsx`             | 404 page -- catch-all for unmatched paths                                                            |
| `src/components/auth/ProtectedRoute.tsx` | Auth guard wrapper -- redirects to `/` if the user is not signed in                                  |
| `src/components/auth/AuthProvider.tsx`   | Provides auth context (`useAuth`) consumed by `RootLayout`, pages, and `ProtectedRoute`              |

## Route Table

| Path    | Component      | Protected | Description                                                     |
| ------- | -------------- | --------- | --------------------------------------------------------------- |
| `/`     | `LandingPage`  | No        | Public landing page; auto-redirects to `/home` if authenticated |
| `/home` | `HomePage`     | Yes       | Main todos workspace (wrapped in `ProtectedRoute`)              |
| `*`     | `NotFoundPage` | No        | Catch-all 404 page for unmatched routes                         |

All routes are children of `RootLayout`, which means they share the same nav header and render into its `<Outlet>`. The layout route also has an `errorElement={<ErrorPage />}` that catches errors thrown by any child route.

## How It Works

1. `src/main.tsx` renders `<App />` inside React `StrictMode` and a Redux `<Provider>`.
2. `App` (`src/App.tsx`) wraps everything in `<BrowserRouter>`, then `<AuthProvider>` (so all routes and the layout have access to auth state).
3. The route tree is defined inline inside `App`:
   - A parent `<Route>` with `element={<RootLayout />}` and `errorElement={<ErrorPage />}` acts as a layout route (no `path`, so it matches all children).
   - `<Route index>` maps `/` to `LandingPage`.
   - `<Route path="home">` maps `/home` to `HomePage`, wrapped in `<ProtectedRoute>`.
   - `<Route path="*">` maps any unmatched path to `NotFoundPage`.
4. `RootLayout` (defined in `src/App.tsx`) renders a `<header>` with an auth-aware nav and an `<Outlet />` where the matched child route renders.

### RootLayout Header Behavior

The header adapts based on authentication state:

- **Always visible:** "Todo" link that navigates to `/`.
- **When authenticated:** A "Home" link appears in the nav. The user's display name and a "Sign out" button appear on the right side of the header.
- **When not authenticated (or loading):** Only the "Todo" link is shown; no user info or Home link.

### Route Protection

- `ProtectedRoute` (`src/components/auth/ProtectedRoute.tsx`) wraps `<HomePage />` in the route definition. It reads auth state from `useAuth()`:
  - While auth is loading, it renders a loading indicator.
  - If no user is signed in, it redirects to `/` via `<Navigate to="/" replace />`.
  - If the user is signed in, it renders `children`.
- `LandingPage` has the inverse logic: if a user is already signed in, it auto-redirects to `/home` via `<Navigate to="/home" replace />`.

## Architecture / Component Tree

```
<StrictMode>
  <Provider store={store}>                     <!-- Redux -->
    <App>
      <BrowserRouter>
        <AuthProvider>                         <!-- Firebase Auth context -->
          <Routes>
            <Route element={<RootLayout />}    <!-- layout wrapper (auth-aware header) -->
                   errorElement={<ErrorPage />}>
              <Route index → LandingPage />              <!-- / -->
              <Route path="home" →                       <!-- /home -->
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              />
              <Route path="*" → NotFoundPage />          <!-- catch-all 404 -->
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </App>
  </Provider>
</StrictMode>
```

## Design Decisions

- **Library mode over framework mode.** The declarative `<Routes>`/`<Route>` approach was chosen over React Router v7's file-based framework mode. This keeps all route definitions in a single file (`src/App.tsx`) for easy scanning and avoids the need for a routing convention/build plugin.
- **Single `react-router` package.** React Router v7 consolidated `react-router-dom` into `react-router`. Only `react-router` (^7.13.0) is listed as a dependency.
- **Layout route pattern.** `RootLayout` is a pathless layout route that wraps all child routes, providing a shared nav header without duplicating markup in each page component. It is defined in the same file as `App` since it is tightly coupled to the route structure.
- **Auth inside the router.** `AuthProvider` is placed inside `BrowserRouter` but outside `Routes`. This lets both the layout (`RootLayout`) and individual pages access auth state, and allows pages to use router-aware redirects (`<Navigate>`).
- **Colocated route protection.** Rather than a global auth check, each protected route explicitly wraps its element in `<ProtectedRoute>`. This makes it immediately clear in the route table which routes require authentication.
- **All pages in `src/pages/`.** Every page component lives in `src/pages/`, regardless of whether it is public or feature-specific. This keeps page locations predictable.

## Adding a New Route

1. Create the page component in `src/pages/YourPage.tsx`.
2. Import the component in `src/App.tsx`.
3. Add a `<Route path="your-path" element={<YourPage />} />` inside the `<Route element={<RootLayout />}>` block (or outside it, if the page should not use the shared layout).
4. If the route requires authentication, wrap the element in `<ProtectedRoute>`:
   ```tsx
   <Route
     path="your-path"
     element={
       <ProtectedRoute>
         <YourPage />
       </ProtectedRoute>
     }
   />
   ```
5. If the route should appear in the nav header, add a `<Link>` to the `RootLayout` function in `src/App.tsx`.

## Related Documentation

- [Docs index](./README.md)
- [Firebase Auth](./firebase-auth.md) -- covers `AuthProvider`, `useAuth`, `ProtectedRoute`, and Google sign-in
- [State Management](./state-management.md) -- covers the Redux `<Provider>` that wraps the app
