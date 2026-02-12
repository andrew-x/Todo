# Docs Librarian Memory

## Project Overview

- Todo app: React 19 + TypeScript 5.9 + Vite 7 + Tailwind 4
- Package manager: bun
- Path alias: `@/*` -> `src/*`

## /docs Folder Structure

- `docs/README.md` -- index/table of contents for all documentation
- `docs/routing.md` -- React Router v7 declarative routing setup

## Architecture Notes

- **Routing**: React Router v7 (^7.13.0), library/declarative mode, single `react-router` package
- **App shell**: `src/app/` contains App.tsx (composition root), AppRouter.tsx (route table), RootLayout.tsx (shared layout)
- **Pages**: General pages in `src/app/pages/`, feature pages in `src/features/<feature>/`
- **Entry point**: `src/main.tsx` -> `App` -> `BrowserRouter` -> `AppRouter`
- Routes: `/` (LandingPage), `/home` (HomePage)

## Conventions

- Doc filenames: lowercase, hyphen-separated (e.g., `routing.md`)
- Every new doc must be added to the `docs/README.md` table
- Features not yet implemented: auth, Firebase/Firestore, RTK Query, shared components (listed in CLAUDE.md project structure but folders don't exist yet)
