# Routing

> The app uses React Router v7 in **library/declarative mode** (the `react-router` package with `BrowserRouter`, `Routes`, and `Route`). All routes are nested under a shared root layout that provides a persistent nav header.

## Overview

React Router v7 ships as a single `react-router` package (the former `react-router-dom` was merged into it). This project uses the **library (declarative) mode** -- meaning routes are defined as JSX `<Route>` elements rather than using the framework/file-based routing mode. This keeps routing explicit and co-located in one file.

## Key Files

| File                              | Role                                                          |
| --------------------------------- | ------------------------------------------------------------- |
| `src/main.tsx`                    | Entry point -- renders `<App />` inside `StrictMode`          |
| `src/app/App.tsx`                 | Composition root -- wraps the app in `<BrowserRouter>`        |
| `src/app/AppRouter.tsx`           | Route table -- declares all `<Routes>` and `<Route>` elements |
| `src/app/RootLayout.tsx`          | Shared layout -- nav header + `<Outlet>` for child routes     |
| `src/app/pages/LandingPage.tsx`   | Public landing page (`/`)                                     |
| `src/features/todos/HomePage.tsx` | Todos workspace page (`/home`)                                |

## Route Table

| Path    | Component     | Description                                |
| ------- | ------------- | ------------------------------------------ |
| `/`     | `LandingPage` | Public landing page with welcome message   |
| `/home` | `HomePage`    | Main todos workspace (placeholder for now) |

Both routes are children of `RootLayout`, which means they share the same nav header and render into its `<Outlet>`.

## How It Works

1. `src/main.tsx` renders `<App />` inside React `StrictMode`.
2. `App` (`src/app/App.tsx`) wraps everything in `<BrowserRouter>`, which provides the routing context.
3. `AppRouter` (`src/app/AppRouter.tsx`) defines the route tree:
   - A parent `<Route>` with `element={<RootLayout />}` acts as a layout route (no `path`, so it matches all children).
   - `<Route index>` maps `/` to `LandingPage`.
   - `<Route path="home">` maps `/home` to `HomePage`.
4. `RootLayout` (`src/app/RootLayout.tsx`) renders a `<header>` with navigation links ("Landing" -> `/`, "Home" -> `/home`) and an `<Outlet />` where the matched child route renders.

## Architecture / Component Tree

```
<StrictMode>
  <App>
    <BrowserRouter>
      <AppRouter>
        <Routes>
          <Route element={<RootLayout />}>     <!-- layout wrapper -->
            <Route index → LandingPage />      <!-- / -->
            <Route path="home" → HomePage />   <!-- /home -->
          </Route>
        </Routes>
      </AppRouter>
    </BrowserRouter>
  </App>
</StrictMode>
```

## Design Decisions

- **Library mode over framework mode.** The declarative `<Routes>`/`<Route>` approach was chosen over React Router v7's file-based framework mode. This keeps all route definitions in a single file (`AppRouter.tsx`) for easy scanning and avoids the need for a routing convention/build plugin.
- **Single `react-router` package.** React Router v7 consolidated `react-router-dom` into `react-router`. Only `react-router` (^7.13.0) is listed as a dependency.
- **Layout route pattern.** `RootLayout` is a pathless layout route that wraps all child routes, providing a shared nav header without duplicating markup in each page component.
- **Page file locations.** General/public pages live in `src/app/pages/`. Feature-specific pages live in their feature folder (e.g., `src/features/todos/HomePage.tsx`). This keeps feature code co-located while keeping generic pages in the app shell.

## Adding a New Route

1. Create the page component in the appropriate location:
   - General/public pages: `src/app/pages/`
   - Feature pages: `src/features/<feature>/`
2. Import the component in `src/app/AppRouter.tsx`.
3. Add a `<Route path="your-path" element={<YourPage />} />` inside the `<Route element={<RootLayout />}>` block (or outside it, if the page should not use the shared layout).
4. If the route should appear in the nav header, add a `<Link>` to `src/app/RootLayout.tsx`.

## Related Documentation

- [Docs index](./README.md)
