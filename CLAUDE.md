# Todo App

Simple todo app with unified input that auto-detects tags, labels, and dates.

> **Self-maintaining doc**: Keep this file up to date. When a new convention, pattern, dependency, or workflow change is introduced during a conversation, update CLAUDE.md immediately to reflect it. This includes new libraries, folder changes, naming rules, architectural decisions, and any user-specified preferences.

## Tech Stack

- React 19, TypeScript 5.9 (strict), Vite 7
- Tailwind 4 (utility classes only, no component library)
- RTK Query (server state via Firestore)
- Firebase: Firestore (todos) + Auth (user accounts)
- Path alias: `@/*` → `src/*`

## Commands

```
bun dev          # dev server
bun run build    # typecheck + build
bun run lint     # eslint
bun run lint:fix # eslint --fix
bun run format   # prettier --write
```

## Project Structure

```
src/
  pages/            # Route-level page components
  components/       # Components separated by feature area
    common/         # Design system / shared UI components
  lib/              # Libraries, utilities, and helpers
  store/            # RTK store setup, API slice base
  firebase/         # Firebase app init, auth helpers, Firestore refs
docs/               # Feature documentation, data flows, architecture notes
```

## Docs Librarian

This project uses a `docs-librarian` subagent to maintain living documentation in `/docs`.

**When to consult it (read):**

- Before implementing changes to a feature — ask the librarian how it currently works to get up-to-date context instead of exploring the codebase yourself.
- When you need to understand a data flow, component hierarchy, or how pieces of the system fit together.

**When to update it (write):**

- After implementing a new feature or completing a significant change to an existing feature, proactively launch the librarian to document what was built/changed.
- After refactoring that alters architecture, file structure, or data flows.

**How to call it:**
Use the `Task` tool with `subagent_type: "docs-librarian"`. Be specific in the prompt:

- **Reading:** "Explain how [feature X] currently works — check /docs and the source code, then give me a summary."
- **Writing:** "I just implemented [describe change]. Review the code and create/update documentation in /docs to reflect this."
