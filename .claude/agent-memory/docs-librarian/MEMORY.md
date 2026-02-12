# Docs Librarian Memory

## Project Overview

- Todo app: React 19 + TypeScript 5.9 + Vite 7 + Tailwind 4
- Package manager: bun
- Path alias: `@/*` -> `src/*`

## /docs Folder Structure

- `docs/README.md` -- index/table of contents for all documentation
- `docs/design-system.md` -- reusable UI components, variant architecture, size scale, accessibility
- `docs/routing.md` -- React Router v7 declarative routing setup

## Architecture Notes

- **Routing**: React Router v7 (^7.13.0), library/declarative mode, single `react-router` package
- **App shell**: `src/app/` contains App.tsx (composition root), AppRouter.tsx (route table), RootLayout.tsx (shared layout)
- **Pages**: General pages in `src/pages/`, feature pages in `src/features/<feature>/`
- **Entry point**: `src/main.tsx` -> `App` -> `BrowserRouter` -> `AppRouter`
- Routes: `/` (LandingPage), `/home` (HomePage)

## Design System

- 5 components in `src/components/common/`: Button, TextInput, TextArea, Pill, PillInput
- CVA for type-safe variants; `cn` (`clsx` + `tailwind-merge`) for class merging
- Shared types in `src/lib/types.ts`: `Size` ('xs'-'xl'), `Color` (6 values)
- Consistent size scale (xs-xl) across components; Pill only supports sm/md
- PillInput composes Pill; all other components are standalone
- Phosphor Icons used for spinner (CircleNotch) and remove button (X)
- Error pattern: `border-error` + `aria-invalid` + `aria-describedby`
- No barrel files; import directly from component files
- Claude agent reference: `.claude/rules/design-system.md`

## Theme & Styling

- Dark-only theme in `src/styles/index.css` via Tailwind v4 `@theme`
- Custom utilities in `src/styles/utilities.css` (center-all, stack, transition-smooth, focus-ring)
- Semantic tokens only -- never raw Tailwind colors
- Color palette: zinc (neutrals) + indigo (accent), oklch values
- Theme rule for agents: `.claude/rules/theme.md`

## Conventions

- Doc filenames: lowercase, hyphen-separated (e.g., `routing.md`)
- Every new doc must be added to the `docs/README.md` table
- Features not yet implemented: auth, Firebase/Firestore, RTK Query
- No barrel files anywhere in the project
