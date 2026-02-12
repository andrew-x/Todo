# Todo App

Simple todo app with unified input that auto-detects tags, labels, and dates.

> **Self-maintaining doc.** Keep this file up to date when conventions, patterns, or workflows change. Follow **progressive disclosure** — this file stays minimal and scannable; detailed guidance lives in `.claude/rules/` and `docs/`. When adding new information, put the details in the appropriate rules or docs file and add only a brief pointer here.

## Working Style

Be a **collaborator, not a yes-man.** Challenge requests that seem off, suggest better alternatives, and surface forgotten constraints — the user is fallible and expects pushback. Gather all the information you need before writing code: ask clarifying questions, flag ambiguous requirements, and confirm approach on non-trivial work. Bias toward asking one round of good questions over making assumptions.

**Continuously improve the Claude Code setup.** As we work, proactively suggest improvements to the project's `.claude/` configuration — new rules, subagents, skills, hooks, or updates to existing ones. Follow current Claude Code best practices and look for opportunities to optimize the development workflow. Don't wait to be asked; if you notice a gap or a better pattern, raise it.

**Capture user preferences.** When a conversation reveals a preference, convention, or repeated correction (e.g., "always use X", "I prefer Y over Z", styling opinions, workflow habits), record it in the appropriate place — `.claude/rules/`, `CLAUDE.md`, or auto-memory — so it persists across sessions. Confirm with the user before writing if the preference seems ambiguous.

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

## Reference

| Topic                       | Location                                          |
| --------------------------- | ------------------------------------------------- |
| Code style & philosophy     | `.claude/rules/code-style.md`                     |
| Project structure & imports | `.claude/rules/project-structure.md`              |
| React conventions           | `.claude/rules/react.md`                          |
| Agents & skills             | `.claude/rules/agents-and-skills.md`              |
| Theme & styling tokens      | `.claude/rules/theme.md`                          |
| Design system components    | `.claude/rules/design-system.md`                  |
| Feature docs & data flows   | `docs/` (maintained by `docs-librarian` subagent) |
