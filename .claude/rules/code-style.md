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

## Naming Conventions

- PascalCase for component files, component folders, and component names
- `on` prefix for event handler props (e.g., `onSubmit`, `onClick`)
- Boolean variables and props use `is`, `has`, `should` prefixes (e.g., `isLoading`, `hasError`)

## Icons (Phosphor Icons)

- Always import with the `Icon` suffix — the bare noun import is deprecated

  ```ts
  // Correct
  import { CheckIcon, TrashIcon } from '@phosphor-icons/react'

  // Wrong (deprecated)
  import { Check, Trash } from '@phosphor-icons/react'
  ```
