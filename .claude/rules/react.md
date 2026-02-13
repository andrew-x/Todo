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
- **Inline prop types** directly in the function signature unless there are many props (roughly 4+) or the type is complex (unions, intersections with `Omit`/`VariantProps`, discriminated unions):

  ```tsx
  // Correct — few simple props, inline them
  export default function ViewSwitcher(props: {
    activeView: View
    onViewChange: (view: View) => void
  }) { ... }

  // Wrong — unnecessary separate type for simple props
  type ViewSwitcherProps = {
    activeView: View
    onViewChange: (view: View) => void
  }
  export default function ViewSwitcher({ activeView, onViewChange }: ViewSwitcherProps) { ... }

  // Correct — many props or complex type, keep separate
  export type TaskCardProps = {
    task: Task
    onUpdate: (updates: Partial<Task>) => void
    onDelete: () => void
    onEdit?: () => void
    className?: string
    isDragging?: boolean
    dragHandleListeners?: SyntheticListenerMap
    dragHandleAttributes?: DraggableAttributes
  }
  ```

## Component Organization

- Don't nest helper functions inside components — extract them as standalone functions above or in a separate file
- Ternaries in JSX are fine
- When a component grows large, extract sub-components into separate files

## Types

- Prefer `interface` over `type` for object shapes
- See "Inline prop types" rule above — only extract a named type when there are many props or the type is complex

## Hooks

- Extract custom hooks only when there's clear reuse across multiple components
- Don't preemptively create hooks for single-use logic
