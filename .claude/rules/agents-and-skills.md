# Agents & Skills

## Docs Librarian (`docs-librarian` subagent)

Maintains living documentation in `/docs`. Call via `Task` tool with `subagent_type: "docs-librarian"`.

**Consult (read) before** implementing changes to a feature — ask how it currently works to get up-to-date context instead of exploring the codebase yourself. Also useful when you need to understand a data flow, component hierarchy, or how pieces fit together.

**Update (write) after** implementing a new feature, completing a significant change to an existing feature, or refactoring that alters architecture, file structure, or data flows. Proactively launch the librarian — don't wait to be asked.

Prompt examples:

- **Read:** "Explain how [feature X] currently works — check /docs and the source code, then give me a summary."
- **Write:** "I just implemented [describe change]. Review the code and create/update documentation in /docs to reflect this."

## Tech Researcher (`tech-researcher` subagent)

Looks up current documentation, migration guides, best practices, and breaking changes. Call via `Task` tool with `subagent_type: "tech-researcher"`.

Use before working with a library or API you haven't used recently, when upgrading dependencies, or when you need to confirm your knowledge is up-to-date.

Prompt examples:

- "Find the latest migration guide for upgrading from [library vX] to [vY] and list breaking changes."
- "What is the current recommended way to handle [pattern] with [library]?"

## Design System Specialist (`design-system-specialist` subagent)

Guardian of `src/components/common/`. Call via `Task` tool with `subagent_type: "design-system-specialist"`.

**Use when** creating, updating, or modifying shared UI components, when you need guidance on existing design system components, or when you want to ensure a new UI feature follows established patterns. Proactively launch whenever work touches `components/common/`.

Prompt examples:

- **Audit:** "What shared components exist in `components/common/`? I need a dialog/modal for [use case] — does one exist or should I create one?"
- **Create:** "Create a [Component] component for [use case]. Check existing components for pattern consistency."
- **Review:** "I just created a new [Component] in `components/common/`. Review it for design system consistency."

## Skills (via `Skill` tool)

- **`react-best-practices`** — Vercel's React performance optimization guidelines. Invoke when writing, reviewing, or refactoring React components.
- **`web-design-guidelines`** — Web Interface Guidelines review. Invoke when asked to review UI, check accessibility, audit design, or review UX.
