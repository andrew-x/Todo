---
paths:
  - 'src/**/*.tsx'
  - 'src/**/*.jsx'
---

# React Component Rules

## Component Declaration

- Use named function declarations for components, not arrow functions:

  ```tsx
  // Correct
  export function TodoItem({ title, isDone }: Props) { ... }

  // Wrong
  export const TodoItem = ({ title, isDone }: Props) => { ... }
  ```

- Use named exports, never default exports
- Keep prop types inline unless there are many props (roughly 4+)

## Component Organization

- Don't nest helper functions inside components — extract them as standalone functions above or in a separate file
- Ternaries in JSX are fine
- When a component grows large, extract sub-components into separate files

## Types

- Prefer `interface` over `type` for object shapes
- Inline simple prop types; extract an interface only when there are many props

## Hooks

- Extract custom hooks only when there's clear reuse across multiple components
- Don't preemptively create hooks for single-use logic
