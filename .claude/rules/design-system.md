---
paths:
  - 'src/components/common/**'
---

# Design System

## Stack

- **CVA** (`class-variance-authority`) for type-safe variant definitions
- **cn** (`@/lib/classnames`) for merging classes — `className` is always last so consumer overrides win

## Components (`src/components/common/`)

| Component | File | Variants / Props |
|-----------|------|-----------------|
| `Button` | `Button.tsx` | `variant`: default, primary, outline, ghost, link · `size`: xs–xl · `isLoading` · polymorphic (`href` → `<a>`) |
| `TextInput` | `TextInput.tsx` | `size`: xs–xl · `label` · `error` |
| `TextArea` | `TextArea.tsx` | `size`: xs–xl · `label` · `error` |
| `Pill` | `Pill.tsx` | `color`: default, primary, secondary, success, warning, error · `size`: sm, md · `onRemove` |
| `PillInput` | `PillInput.tsx` | `size`: xs–xl · `values` / `onValuesChange` · `label` · `error` |

## Size Scale

| Size | Height | Text | Padding-X | Rounded | Gap |
|------|--------|------|-----------|---------|-----|
| xs | h-6 | text-xs | px-2 | rounded | gap-1 |
| sm | h-8 | text-sm | px-3 | rounded-md | gap-1.5 |
| md | h-10 | text-sm | px-4 | rounded-lg | gap-2 |
| lg | h-12 | text-base | px-5 | rounded-lg | gap-2.5 |
| xl | h-14 | text-lg | px-6 | rounded-xl | gap-3 |

## Color Variants (Pill/Button)

| Color | Background | Text |
|-------|-----------|------|
| default | bg-surface | text-text-secondary |
| primary | bg-accent | text-white |
| secondary | bg-accent-subtle | text-accent-text |
| success | bg-success-subtle | text-success |
| warning | bg-warning-subtle | text-warning |
| error | bg-error-subtle | text-error |

## Patterns

- All components accept `className` for overrides (last in `cn()`)
- Input/TextArea/PillInput use `useId()` for accessible label association
- Error state: `border-error` + `aria-invalid` + `aria-describedby`
- Shared types: `Size`, `Color` from `@/lib/types.ts`
- Variant definitions are not exported (React Refresh restriction) — kept internal to each component file
