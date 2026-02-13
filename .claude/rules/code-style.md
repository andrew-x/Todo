# Code Style & Philosophy

## General Philosophy

- Prioritize code maintainability and developer experience above all
- Code should be easy to understand, maintain, and build on
- Abstract when there is clear reuse — avoid premature abstraction
- Keep things simple and readable for the next engineer
- Three similar lines of code is better than a premature helper function

## Readability

- Use early returns and guard clauses — avoid deep nesting
- Code should be self-documenting by default
- Add comments only for complex or non-obvious logic — never for obvious code
- When a function or component grows large, extract pieces into separate functions/files

## Exports

- Use `export default function ComponentName()` — co-locate the export with the declaration
- Never separate the default export from the function definition (no `export default ComponentName` at the bottom)
- This applies to components and any function that is the default export of a file
- **Exception:** `forwardRef` components can't use `export default function`, so they use named exports instead (`export { MyComponent }`)
- Export types inline with their declaration — never separate the export from the type definition
- Import default exports as default, not destructured: `import Button from '...'` not `import { Button } from '...'`

  ```ts
  // Correct
  export default function MyComponent() { ... }

  // Wrong
  function MyComponent() { ... }
  export default MyComponent

  // Wrong
  function MyComponent() { ... }
  export { MyComponent }

  // Correct — export type inline with declaration
  export type MyComponentProps = { ... }

  // Wrong — separate export from declaration
  type MyComponentProps = { ... }
  export type { MyComponentProps }

  // Correct — importing default + named type
  import Button, { type ButtonProps } from '@/components/common/Button'

  // Wrong
  import { Button } from '@/components/common/Button'
  ```

## Naming Conventions

- PascalCase for component files, component folders, and component names
- `on` prefix for event handler props (e.g., `onSubmit`, `onClick`)
- Boolean variables and props use `is`, `has`, `should` prefixes (e.g., `isLoading`, `hasError`)

## Logging

- Use `logger` from `@/lib/logger` for permanent, intentional log messages that should stay in the codebase (e.g., error reporting, important state transitions, audit-worthy events)
- Use bare `console.log` only for temporary debugging — these should be removed before committing
- If a log statement is worth keeping, it belongs in `logger.info()` or `logger.error()`

## Icons (Phosphor Icons)

- Always import with the `Icon` suffix — the bare noun import is deprecated

  ```ts
  // Correct
  // Wrong (deprecated)
  import { Check, CheckIcon, Trash, TrashIcon } from '@phosphor-icons/react'
  ```
